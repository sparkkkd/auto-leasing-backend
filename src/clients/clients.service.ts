import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateClientDto, UpdateClientDto, FindAllClientsDto } from './dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: FindAllClientsDto) {
    const { search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    let where: Prisma.ClientWhereInput = {};

    if (search) {
      const words = search
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0);

      if (words.length > 0) {
        where = {
          AND: words.map((word) => ({
            OR: [
              { firstName: { contains: word, mode: 'insensitive' } },
              { lastName: { contains: word, mode: 'insensitive' } },
              { middleName: { contains: word, mode: 'insensitive' } },
              { phone: { contains: word } },
              { email: { contains: word, mode: 'insensitive' } },
            ],
          })),
        };
      }
    }

    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.count({ where }),
    ]);

    return {
      data: clients,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        deals: {
          include: {
            car: true,
            investor: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Клиент не найден');
    }

    return client;
  }

  async create(createClientDto: CreateClientDto) {
    if (createClientDto.email) {
      const existing = await this.prisma.client.findUnique({
        where: { email: createClientDto.email },
      });

      if (existing) {
        throw new ConflictException('Клиент с таким email уже существует');
      }
    }

    return this.prisma.client.create({
      data: createClientDto,
    });
  }

  async update(id: string, updateClientDto: UpdateClientDto) {
    const client = await this.prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException('Клиент не найден');
    }

    if (updateClientDto.email && updateClientDto.email !== client.email) {
      const existing = await this.prisma.client.findUnique({
        where: { email: updateClientDto.email },
      });

      if (existing) {
        throw new ConflictException('Клиент с таким email уже существует');
      }
    }

    return this.prisma.client.update({
      where: { id },
      data: updateClientDto,
    });
  }

  async remove(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: { deals: true },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Клиент не найден');
    }

    if (client._count.deals > 0) {
      throw new BadRequestException(
        'Нельзя удалить клиента с активными сделками',
      );
    }

    await this.prisma.client.delete({ where: { id } });

    return { message: 'Клиент успешно удален' };
  }
}
