import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

import { ExpenseType } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ExpenseService {
  constructor(private prisma: PrismaService) {}

  async create(createExpenseDto: CreateExpenseDto, authorId: string) {
    if (createExpenseDto.type === ExpenseType.CAR && !createExpenseDto.carId) {
      throw new BadRequestException(
        'Для расхода по машине необходимо указать машину (carId)',
      );
    }

    if (createExpenseDto.carId) {
      const car = await this.prisma.car.findUnique({
        where: { id: createExpenseDto.carId },
      });
      if (!car) {
        throw new NotFoundException('Машина не найдена');
      }
    }

    return this.prisma.expense.create({
      data: {
        ...createExpenseDto,
        authorId,
      },
      include: {
        car: true,
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findAll(params?: {
    carId?: string;
    type?: ExpenseType;
    page?: number;
    limit?: number;
  }) {
    const { carId, type, page = 1, limit = 20 } = params || {};
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.expense.findMany({
        where: {
          ...(carId && { carId }),
          ...(type && { type }),
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          car: { select: { id: true, make: true, model: true } },
          author: { select: { id: true, name: true } },
        },
      }),
      this.prisma.expense.count({
        where: {
          ...(carId && { carId }),
          ...(type && { type }),
        },
      }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        car: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });

    if (!expense) {
      throw new NotFoundException('Расход не найден');
    }

    return expense;
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto) {
    if (updateExpenseDto.type === ExpenseType.CAR && !updateExpenseDto.carId) {
      throw new BadRequestException(
        'Для расхода по машине необходимо указать машину (carId)',
      );
    }

    return this.prisma.expense.update({
      where: { id },
      data: updateExpenseDto,
      include: {
        car: true,
        author: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string) {
    await this.prisma.expense.delete({ where: { id } });
    return { message: 'Расход успешно удалён' };
  }
}
