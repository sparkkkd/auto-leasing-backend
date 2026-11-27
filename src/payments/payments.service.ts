import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreatePaymentDto, UpdatePaymentDto, FindAllPaymentsDto } from './dto';
import { PrismaService } from 'prisma/prisma.service';
import { PaginatedResponse } from 'src/common/types/paginated-response.type';
import { PaymentResponse, PaymentsListResponse } from './payments.types';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    query: FindAllPaymentsDto,
  ): Promise<PaginatedResponse<PaymentsListResponse>> {
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
      where.paymentDate = {};
      if (dateFrom) {
        where.paymentDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.paymentDate.lte = new Date(dateTo);
      }
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paymentDate: 'desc' },
        select: {
          id: true,
          direction: true,
          amount: true,
          paymentDate: true,
          comments: true,

          createdAt: true,

          deal: {
            select: {
              id: true,
              contractNumber: true,

              client: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  middleName: true,
                },
              },

              investor: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },

              car: {
                select: {
                  id: true,
                  make: true,
                  model: true,
                  color: true,
                  year: true,
                  licensePlate: true,
                  vin: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<PaymentResponse> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      select: {
        id: true,
        direction: true,
        amount: true,
        paymentDate: true,
        comments: true,
        notes: true,

        createdAt: true,
        updatedAt: true,

        deal: {
          select: {
            id: true,
            contractNumber: true,
            comments: true,

            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                middleName: true,
                phone: true,
                email: true,
                comments: true,
              },
            },

            investor: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },

            car: {
              select: {
                id: true,
                make: true,
                model: true,
                color: true,
                year: true,
                licensePlate: true,
                vin: true,
                equipment: true,
                showroom: true,
                purchasePrice: true,
                sellingPrice: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Платеж не найден');
    }

    return payment;
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
        paymentDate: new Date(createPaymentDto.paymentDate),
        comments: createPaymentDto.comments,
        notes: createPaymentDto.notes,
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
        paymentDate: updatePaymentDto.paymentDate
          ? new Date(updatePaymentDto.paymentDate)
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
