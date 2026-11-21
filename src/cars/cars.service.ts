import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateCarDto, UpdateCarDto, FindAllCarsDto } from './dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class CarsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: FindAllCarsDto) {
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
        include: {
          deal: {
            include: {
              client: true,
              investor: true,
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

  async findOne(id: string) {
    const car = await this.prisma.car.findUnique({
      where: { id },
      include: {
        deal: {
          include: {
            client: true,
            investor: true,
            payments: true,
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
        deal: true,
      },
    });

    if (!car) {
      throw new NotFoundException('Машина не найдена');
    }

    if (car.deal) {
      throw new BadRequestException('Нельзя удалить машину с активной сделкой');
    }

    await this.prisma.car.delete({ where: { id } });

    return { message: 'Машина успешно удалена' };
  }
}
