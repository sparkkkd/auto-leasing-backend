import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  Prisma,
  CarStatus,
  DealStatus,
  PaymentDirection,
} from '@prisma/client';
import { CreateDealDto, UpdateDealDto, FindAllDealsDto } from './dto';
import { PrismaService } from 'prisma/prisma.service';
import { OverduePaymentDto } from './dto/overdue-payment.dto';
import { addMonthsSafe } from 'src/common/utils/addMonthsSafe';
import {
  ClientPaymentSchedulesDto,
  PaymentScheduleDto,
  PaymentScheduleItem,
} from './dto/payment-schedule.dto';

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
            { comments: { contains: word, mode: 'insensitive' } },
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
          orderBy: { paymentDate: 'desc' },
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
      include: { deals: true },
    });

    if (!car) {
      throw new NotFoundException('Машина не найдена');
    }

    if (car.deals) {
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
          startDate: new Date(createDealDto.startDate),
          endDate: new Date(createDealDto.endDate),
          term: createDealDto.term,
          firstPayment: createDealDto.firstPayment,
          monthlyPayment: createDealDto.monthlyPayment,
          finalCarPrice: createDealDto.finalCarPrice,
          clientTotalAmount: createDealDto.clientTotalAmount,
          investorTotalAmount: createDealDto.investorTotalAmount,
          status: createDealDto.status || 'ACTIVE',
          contractScanId: createDealDto.contractScanId,
          investorContractScanId: createDealDto.investorContractScanId,
          comments: createDealDto.comments,
          notes: createDealDto.notes,
        },
        include: {
          client: { select: { id: true, firstName: true, lastName: true } },
          investor: { select: { id: true, name: true } },
          car: { select: { id: true, make: true, model: true, vin: true } },
          contractScan: true,
          investorContractScan: true,
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

    const RELEASE_CAR_STATUSES: DealStatus[] = [
      DealStatus.CANCELLED,
      DealStatus.TERMINATED,
    ];

    const shouldReleaseCar =
      updateDealDto.status !== undefined &&
      RELEASE_CAR_STATUSES.includes(updateDealDto.status) &&
      !RELEASE_CAR_STATUSES.includes(deal.status);

    if (shouldReleaseCar) {
      return this.prisma.$transaction(async (tx) => {
        const updatedDeal = await tx.deal.update({
          where: { id },
          data: updateDealDto,
          include: {
            client: { select: { id: true, firstName: true, lastName: true } },
            investor: { select: { id: true, name: true } },
            car: { select: { id: true, make: true, model: true, vin: true } },
          },
        });

        await tx.car.update({
          where: { id: deal.carId },
          data: { status: CarStatus.IN_STOCK },
        });

        return updatedDeal;
      });
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

  async getOverduePayments(): Promise<OverduePaymentDto[]> {
    const deals = await this.prisma.deal.findMany({
      where: {
        status: DealStatus.ACTIVE,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
          },
        },
        payments: {
          where: {
            direction: PaymentDirection.CLIENT_TO_COMPANY,
          },
          orderBy: {
            paymentDate: 'asc',
          },
        },
      },
    });

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const overdueList: OverduePaymentDto[] = [];

    for (const deal of deals) {
      const paidCount = deal.payments.length;

      if (paidCount >= deal.term) {
        continue;
      }

      const currentMonth = paidCount + 1;

      const expectedDate = addMonthsSafe(deal.startDate, paidCount);

      expectedDate.setHours(0, 0, 0, 0);

      const daysUntilDue = Math.floor(
        (expectedDate.getTime() - now.getTime()) / MS_PER_DAY,
      );

      let status: 'warning' | 'critical' | 'overdue';
      if (daysUntilDue < 0) {
        status = 'overdue';
      } else if (daysUntilDue <= 1) {
        status = 'critical';
      } else if (daysUntilDue <= 3) {
        status = 'warning';
      } else {
        continue;
      }

      const clientName = [
        deal.client.lastName,
        deal.client.firstName,
        deal.client.middleName,
      ]
        .filter(Boolean)
        .join(' ');

      overdueList.push({
        dealId: deal.id,
        clientId: deal.client.id,
        clientName,
        nextPaymentDate: expectedDate,
        monthlyPayment: Number(deal.monthlyPayment),
        status,
        daysUntilDue,
        currentMonth,
      });
    }

    return overdueList.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }

  async getPaymentSchedule(
    clientId: string,
  ): Promise<ClientPaymentSchedulesDto> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
      },
    });

    if (!client) {
      throw new NotFoundException('Клиент не найден');
    }

    const deals = await this.prisma.deal.findMany({
      where: {
        clientId,
      },
      include: {
        payments: {
          where: {
            direction: PaymentDirection.CLIENT_TO_COMPANY,
          },
          orderBy: {
            paymentDate: 'asc',
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const schedules: PaymentScheduleDto[] = deals.map((deal) => {
      const payments: PaymentScheduleItem[] = [];

      for (let monthIndex = 0; monthIndex < deal.term; monthIndex++) {
        const month = monthIndex + 1;
        const dueDate = addMonthsSafe(deal.startDate, monthIndex);
        dueDate.setHours(0, 0, 0, 0);

        const actualPayment = deal.payments[monthIndex];

        let status: 'paid' | 'pending' | 'overdue';
        let paymentId: string | undefined;
        let paidAt: Date | undefined;
        let amount: number | undefined;

        if (actualPayment) {
          status = 'paid';
          paymentId = actualPayment.id;
          paidAt = actualPayment.paymentDate;
          amount = Number(actualPayment.amount);
        } else {
          if (
            deal.status === DealStatus.COMPLETED ||
            deal.status === DealStatus.CANCELLED ||
            deal.status === DealStatus.TERMINATED
          ) {
            status = 'pending';
          } else {
            const daysUntilDue = Math.floor(
              (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            );
            status = daysUntilDue < 0 ? 'overdue' : 'pending';
          }
        }

        payments.push({
          month,
          dueDate,
          status,
          paymentId,
          paidAt,
          amount,
        });
      }

      return {
        dealId: deal.id,
        dealStatus: deal.status,
        clientName: [client.lastName, client.firstName, client.middleName]
          .filter(Boolean)
          .join(' '),
        monthlyPayment: Number(deal.monthlyPayment),
        term: deal.term,
        startDate: deal.startDate,
        payments,
      };
    });

    return {
      clientId: client.id,
      clientName: [client.lastName, client.firstName, client.middleName]
        .filter(Boolean)
        .join(' '),
      schedules,
    };
  }
}
