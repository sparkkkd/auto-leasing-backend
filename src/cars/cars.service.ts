import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateCarDto, UpdateCarDto, FindAllCarsDto } from './dto';
import { PrismaService } from 'prisma/prisma.service';
import { PaginatedResponse } from 'src/common/types/paginated-response.type';
import { CarResponse, CarsListResponse } from './cars.types';

@Injectable()
export class CarsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    query: FindAllCarsDto,
  ): Promise<PaginatedResponse<CarsListResponse>> {
    const { search, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CarWhereInput = {};

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
            { make: { contains: word, mode: 'insensitive' } },
            { model: { contains: word, mode: 'insensitive' } },
            { vin: { contains: word, mode: 'insensitive' } },
            { licensePlate: { contains: word, mode: 'insensitive' } },
            { color: { contains: word, mode: 'insensitive' } },
          ],
        }));
      }
    }

    const [cars, total] = await Promise.all([
      this.prisma.car.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          make: true,
          model: true,
          year: true,
          color: true,
          equipment: true,
          licensePlate: true,
          vin: true,
          purchasePrice: true,
          sellingPrice: true,
          status: true,
          createdAt: true,

          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              middleName: true,
            },
          },

          deals: {
            select: {
              id: true,
              contractNumber: true,
            },
          },
        },
      }),
      this.prisma.car.count({ where }),
    ]);

    return {
      data: cars,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<CarResponse> {
    const car = await this.prisma.car.findUnique({
      where: { id },
      include: {
        deals: {
          select: {
            id: true,
            contractNumber: true,
            startDate: true,
            endDate: true,
            term: true,
            firstPayment: true,
            monthlyPayment: true,
            finalCarPrice: true,
            clientTotalAmount: true,
            investorTotalAmount: true,
            status: true,
            createdAt: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
          },
        },
      },
    });

    if (!car) {
      throw new NotFoundException('Машина не найдена');
    }

    return car;
  }

  async create(createCarDto: CreateCarDto) {
    const existingVin = await this.prisma.car.findUnique({
      where: { vin: createCarDto.vin },
    });

    if (createCarDto.sellingPrice < createCarDto.purchasePrice) {
      throw new BadRequestException(
        'Цена продажи не может быть ниже цены покупки',
      );
    }

    if (existingVin) {
      throw new ConflictException('Машина с таким VIN уже существует');
    }

    if (createCarDto.licensePlate) {
      const existingPlate = await this.prisma.car.findUnique({
        where: { licensePlate: createCarDto.licensePlate },
      });

      if (existingPlate) {
        throw new ConflictException('Машина с таким госномером уже существует');
      }
    }

    return this.prisma.car.create({
      data: createCarDto,
    });
  }

  async update(id: string, updateCarDto: UpdateCarDto) {
    const car = await this.prisma.car.findUnique({
      where: { id },
    });

    if (!car) {
      throw new NotFoundException('Машина не найдена');
    }

    const currentCar = await this.prisma.car.findUnique({ where: { id } });
    if (!currentCar) {
      throw new NotFoundException('Машина не найдена');
    }

    const finalPurchasePrice =
      updateCarDto.purchasePrice ?? currentCar.purchasePrice;
    const finalSellingPrice =
      updateCarDto.sellingPrice ?? currentCar.sellingPrice;

    if (finalSellingPrice < finalPurchasePrice) {
      throw new BadRequestException(
        'Цена продажи не может быть ниже цены покупки',
      );
    }

    if (updateCarDto.vin && updateCarDto.vin !== car.vin) {
      const existingVin = await this.prisma.car.findUnique({
        where: { vin: updateCarDto.vin },
      });

      if (existingVin) {
        throw new ConflictException('Машина с таким VIN уже существует');
      }
    }

    if (
      updateCarDto.licensePlate &&
      updateCarDto.licensePlate !== car.licensePlate
    ) {
      const existingPlate = await this.prisma.car.findUnique({
        where: { licensePlate: updateCarDto.licensePlate },
      });

      if (existingPlate) {
        throw new ConflictException('Машина с таким госномером уже существует');
      }
    }

    return this.prisma.car.update({
      where: { id },
      data: updateCarDto,
    });
  }

  async remove(id: string) {
    const car = await this.prisma.car.findUnique({
      where: { id },
      include: {
        deals: true,
      },
    });

    if (!car) {
      throw new NotFoundException('Машина не найдена');
    }

    if (car.deals) {
      throw new BadRequestException('Нельзя удалить машину с активной сделкой');
    }

    await this.prisma.car.delete({ where: { id } });

    return { message: 'Машина успешно удалена' };
  }
}
