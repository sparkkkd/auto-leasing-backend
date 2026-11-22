import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreatePaymentDto, UpdatePaymentDto, FindAllPaymentsDto } from './dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: FindAllPaymentsDto) {
    const { dealId, direction, dateFrom, dateTo, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {};

    if (dealId) {
      where.dealId = dealId;
    }

    if (direction) {
      where.direction = direction;
    }

    if (dateFrom || dateTo) {
      where.paidAt = {};
      if (dateFrom) {
        where.paidAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.paidAt.lte = new Date(dateTo);
      }
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paidAt: 'desc' },
        include: {
          deal: {
            select: {
              id: true,
              contractNumber: true,
              client: { select: { firstName: true, lastName: true } },
              investor: { select: { name: true } },
              car: { select: { make: true, model: true, vin: true } },
            },
          },
          _count: { select: { documents: true } },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    const data = payments.map((payment) => ({
      ...payment,
      amount: Number(payment.amount),
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        deal: {
          select: {
            id: true,
            contractNumber: true,
            client: true,
            investor: true,
            car: true,
          },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Платеж не найден');
    }

    return {
      ...payment,
      amount: Number(payment.amount),
    };
  }

  async create(createPaymentDto: CreatePaymentDto) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: createPaymentDto.dealId },
    });

    if (!deal) {
      throw new NotFoundException('Сделка не найдена');
    }

    const payment = await this.prisma.payment.create({
      data: {
        dealId: createPaymentDto.dealId,
        direction: createPaymentDto.direction,
        amount: createPaymentDto.amount,
        paidAt: new Date(createPaymentDto.paidAt),
        comment: createPaymentDto.comment,
      },
      include: {
        deal: {
          select: {
            id: true,
            contractNumber: true,
            client: { select: { firstName: true, lastName: true } },
            investor: { select: { name: true } },
          },
        },
      },
    });

    return {
      ...payment,
      amount: Number(payment.amount),
    };
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Платеж не найден');
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id },
      data: {
        ...updatePaymentDto,
        paidAt: updatePaymentDto.paidAt
          ? new Date(updatePaymentDto.paidAt)
          : undefined,
      },
      include: {
        deal: {
          select: {
            id: true,
            contractNumber: true,
            client: { select: { firstName: true, lastName: true } },
            investor: { select: { name: true } },
          },
        },
      },
    });

    return {
      ...updatedPayment,
      amount: Number(updatedPayment.amount),
    };
  }

  async remove(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        _count: { select: { documents: true } },
      },
    });

    if (!payment) {
      throw new NotFoundException('Платеж не найден');
    }

    if (payment._count.documents > 0) {
      throw new BadRequestException(
        'Нельзя удалить платеж с прикрепленными документами. Сначала удалите документы.',
      );
    }

    await this.prisma.payment.delete({ where: { id } });

    return { message: 'Платеж успешно удален' };
  }
}
