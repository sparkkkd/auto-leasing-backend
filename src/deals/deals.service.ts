import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, CarStatus, DealStatus } from '@prisma/client';
import { CreateDealDto, UpdateDealDto, FindAllDealsDto } from './dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class DealsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: FindAllDealsDto) {
    const {
      search,
      clientId,
      investorId,
      status,
      page = 1,
      limit = 20,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DealWhereInput = {};

    if (clientId) {
      where.clientId = clientId;
    }

    if (investorId) {
      where.investorId = investorId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      const words = search
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0);

      if (words.length > 0) {
        where.AND = words.map((word) => ({
          OR: [
            { contractNumber: { contains: word, mode: 'insensitive' } },
            { notes: { contains: word, mode: 'insensitive' } },
            { client: { firstName: { contains: word, mode: 'insensitive' } } },
            { client: { lastName: { contains: word, mode: 'insensitive' } } },
            { investor: { name: { contains: word, mode: 'insensitive' } } },
            { car: { make: { contains: word, mode: 'insensitive' } } },
            { car: { model: { contains: word, mode: 'insensitive' } } },
            { car: { vin: { contains: word, mode: 'insensitive' } } },
            { car: { licensePlate: { contains: word, mode: 'insensitive' } } },
          ],
        }));
      }
    }

    const [deals, total] = await Promise.all([
      this.prisma.deal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
          investor: { select: { id: true, name: true, type: true } },
          car: {
            select: {
              id: true,
              make: true,
              model: true,
              year: true,
              vin: true,
              licensePlate: true,
            },
          },
          _count: { select: { payments: true } },
        },
      }),
      this.prisma.deal.count({ where }),
    ]);

    return {
      data: deals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        client: true,
        investor: true,
        car: true,
        payments: {
          orderBy: { paidAt: 'desc' },
          include: {
            documents: true,
          },
        },
      },
    });

    if (!deal) {
      throw new NotFoundException('Сделка не найдена');
    }

    // Расчет остатков
    const clientPaymentsTotal = deal.payments
      .filter((p) => p.direction === 'CLIENT_TO_COMPANY')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const investorPaymentsTotal = deal.payments
      .filter((p) => p.direction === 'COMPANY_TO_INVESTOR')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const clientTotalAmount = Number(deal.clientTotalAmount);
    const investorTotalAmount = Number(deal.investorTotalAmount);

    return {
      ...deal,
      clientTotalAmount,
      investorTotalAmount,
      clientRemaining: clientTotalAmount - clientPaymentsTotal,
      investorRemaining: investorTotalAmount - investorPaymentsTotal,
      clientPaid: clientPaymentsTotal,
      investorPaid: investorPaymentsTotal,
    };
  }

  async create(createDealDto: CreateDealDto) {
    const startDate = new Date(createDealDto.startDate);
    const endDate = new Date(createDealDto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException(
        'Дата окончания должна быть позже даты начала',
      );
    }

    const client = await this.prisma.client.findUnique({
      where: { id: createDealDto.clientId },
    });
    if (!client) {
      throw new NotFoundException('Клиент не найден');
    }

    const investor = await this.prisma.investor.findUnique({
      where: { id: createDealDto.investorId },
    });
    if (!investor) {
      throw new NotFoundException('Инвестор не найден');
    }

    const car = await this.prisma.car.findUnique({
      where: { id: createDealDto.carId },
      include: { deal: true },
    });

    if (!car) {
      throw new NotFoundException('Машина не найдена');
    }

    if (car.deal) {
      throw new ConflictException('Машина уже участвует в другой сделке');
    }

    const existingDeal = await this.prisma.deal.findUnique({
      where: { contractNumber: createDealDto.contractNumber },
    });
    if (existingDeal) {
      throw new ConflictException(
        'Сделка с таким номером договора уже существует',
      );
    }

    const deal = await this.prisma.$transaction(async (tx) => {
      const newDeal = await tx.deal.create({
        data: {
          clientId: createDealDto.clientId,
          carId: createDealDto.carId,
          investorId: createDealDto.investorId,
          contractNumber: createDealDto.contractNumber,
          startDate,
          endDate,
          clientTotalAmount: createDealDto.clientTotalAmount,
          investorTotalAmount: createDealDto.investorTotalAmount,
          status: createDealDto.status || 'ACTIVE',
          notes: createDealDto.notes,
        },
        include: {
          client: { select: { id: true, firstName: true, lastName: true } },
          investor: { select: { id: true, name: true } },
          car: { select: { id: true, make: true, model: true, vin: true } },
        },
      });

      await tx.car.update({
        where: { id: createDealDto.carId },
        data: { status: CarStatus.IN_WORK },
      });

      return newDeal;
    });

    return deal;
  }

  async update(id: string, updateDealDto: UpdateDealDto) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
    });

    if (!deal) {
      throw new NotFoundException('Сделка не найдена');
    }

    const startDate = updateDealDto.startDate
      ? new Date(updateDealDto.startDate)
      : deal.startDate;
    const endDate = updateDealDto.endDate
      ? new Date(updateDealDto.endDate)
      : deal.endDate;

    if (endDate <= startDate) {
      throw new BadRequestException(
        'Дата окончания должна быть позже даты начала',
      );
    }

    if (
      updateDealDto.contractNumber &&
      updateDealDto.contractNumber !== deal.contractNumber
    ) {
      const existingDeal = await this.prisma.deal.findUnique({
        where: { contractNumber: updateDealDto.contractNumber },
      });
      if (existingDeal) {
        throw new ConflictException(
          'Сделка с таким номером договора уже существует',
        );
      }
    }

    if (
      updateDealDto.status === DealStatus.CANCELLED &&
      deal.status !== DealStatus.CANCELLED
    ) {
      await this.prisma.$transaction(async (tx) => {
        await tx.deal.update({
          where: { id },
          data: updateDealDto,
        });

        await tx.car.update({
          where: { id: deal.carId },
          data: { status: CarStatus.IN_STOCK },
        });
      });

      return this.findOne(id);
    }

    const updatedDeal = await this.prisma.deal.update({
      where: { id },
      data: updateDealDto,
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        investor: { select: { id: true, name: true } },
        car: { select: { id: true, make: true, model: true, vin: true } },
      },
    });

    return updatedDeal;
  }

  async remove(id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        _count: { select: { payments: true } },
      },
    });

    if (!deal) {
      throw new NotFoundException('Сделка не найдена');
    }

    if (deal._count.payments > 0) {
      throw new BadRequestException(
        'Нельзя удалить сделку с существующими платежами. Отмените сделку вместо удаления.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.deal.delete({ where: { id } });

      await tx.car.update({
        where: { id: deal.carId },
        data: { status: CarStatus.IN_STOCK },
      });
    });

    return { message: 'Сделка успешно удалена' };
  }
}
