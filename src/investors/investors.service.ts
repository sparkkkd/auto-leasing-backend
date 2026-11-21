import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CreateInvestorDto,
  UpdateInvestorDto,
  FindAllInvestorsDto,
} from './dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class InvestorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: FindAllInvestorsDto) {
    const { search, type, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.InvestorWhereInput = {};

    if (type) {
      where.type = type;
    }

    if (search) {
      const words = search
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0);

      if (words.length > 0) {
        where.AND = words.map((word) => ({
          OR: [
            { name: { contains: word, mode: 'insensitive' } },
            { contactPerson: { contains: word, mode: 'insensitive' } },
            { phone: { contains: word } },
            { email: { contains: word, mode: 'insensitive' } },
          ],
        }));
      }
    }

    const [investors, total] = await Promise.all([
      this.prisma.investor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.investor.count({ where }),
    ]);

    return {
      data: investors,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const investor = await this.prisma.investor.findUnique({
      where: { id },
      include: {
        deals: {
          include: {
            client: true,
            car: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!investor) {
      throw new NotFoundException('Инвестор не найден');
    }

    return investor;
  }

  async create(createInvestorDto: CreateInvestorDto) {
    if (createInvestorDto.email) {
      const existing = await this.prisma.investor.findUnique({
        where: { email: createInvestorDto.email },
      });

      if (existing) {
        throw new ConflictException('Инвестор с таким email уже существует');
      }
    }

    return this.prisma.investor.create({
      data: createInvestorDto,
    });
  }

  async update(id: string, updateInvestorDto: UpdateInvestorDto) {
    const investor = await this.prisma.investor.findUnique({
      where: { id },
    });

    if (!investor) {
      throw new NotFoundException('Инвестор не найден');
    }

    if (updateInvestorDto.email && updateInvestorDto.email !== investor.email) {
      const existing = await this.prisma.investor.findUnique({
        where: { email: updateInvestorDto.email },
      });

      if (existing) {
        throw new ConflictException('Инвестор с таким email уже существует');
      }
    }

    return this.prisma.investor.update({
      where: { id },
      data: updateInvestorDto,
    });
  }

  async remove(id: string) {
    const investor = await this.prisma.investor.findUnique({
      where: { id },
      include: {
        _count: {
          select: { deals: true },
        },
      },
    });

    if (!investor) {
      throw new NotFoundException('Инвестор не найден');
    }

    if (investor._count.deals > 0) {
      throw new BadRequestException(
        'Нельзя удалить инвестора с активными сделками',
      );
    }

    await this.prisma.investor.delete({ where: { id } });

    return { message: 'Инвестор успешно удален' };
  }
}
