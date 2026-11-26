import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DocumentType, Prisma } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { FindAllDocumentsDto } from './dto';
import { PrismaService } from 'prisma/prisma.service';
import { UploadedFile } from 'src/common/types';
import { ExpiringInsuranceDto } from './dto/expiring-insurance.dto';

@Injectable()
export class DocumentsService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(private prisma: PrismaService) {
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async upload(
    file: UploadedFile,
    paymentId?: string,
    dealId?: string,
    type: DocumentType = 'OTHER',
  ) {
    if (!paymentId && !dealId) {
      throw new BadRequestException('Необходимо указать paymentId или dealId');
    }

    if (paymentId) {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
      });
      if (!payment) {
        throw new NotFoundException('Платеж не найден');
      }
    }

    if (dealId) {
      const deal = await this.prisma.deal.findUnique({ where: { id: dealId } });
      if (!deal) {
        throw new NotFoundException('Сделка не найдена');
      }
    }

    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    const storagePath = path.join(this.uploadDir, uniqueName);

    await fs.writeFile(storagePath, file.buffer);

    const document = await this.prisma.document.create({
      data: {
        fileName: uniqueName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storagePath,
        type,
        paymentId: paymentId || null,
        dealId: dealId || null,
      },
      include: {
        payment: {
          select: {
            id: true,
            deal: {
              select: {
                contractNumber: true,
              },
            },
          },
        },
        deal: {
          select: {
            id: true,
            contractNumber: true,
          },
        },
      },
    });

    return document;
  }

  async findAll(query: FindAllDocumentsDto) {
    const { paymentId, dealId, type, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DocumentWhereInput = {};

    if (paymentId) {
      where.paymentId = paymentId;
    }

    if (dealId) {
      where.dealId = dealId;
    }

    if (type) {
      where.type = type;
    }

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          payment: {
            select: {
              id: true,
              deal: {
                select: {
                  contractNumber: true,
                },
              },
            },
          },
          deal: {
            select: {
              id: true,
              contractNumber: true,
            },
          },
        },
      }),
      this.prisma.document.count({ where }),
    ]);

    return {
      data: documents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        payment: {
          select: {
            id: true,
            deal: {
              select: {
                contractNumber: true,
              },
            },
          },
        },
        deal: {
          select: {
            id: true,
            contractNumber: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Документ не найден');
    }

    return document;
  }

  async download(id: string): Promise<{ fileBuffer: Buffer; document: any }> {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException('Документ не найден');
    }

    try {
      const fileBuffer = await fs.readFile(document.storagePath);
      return { fileBuffer, document };
    } catch {
      throw new NotFoundException('Файл не найден на диске');
    }
  }

  async remove(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException('Документ не найден');
    }

    try {
      await fs.unlink(document.storagePath);
    } catch {
      // ...
    }

    await this.prisma.document.delete({ where: { id } });

    return { message: 'Документ успешно удален' };
  }

  async getExpiringInsurance(
    daysThreshold = 7,
  ): Promise<ExpiringInsuranceDto[]> {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const thresholdDate = new Date(now);
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const insurances = await this.prisma.document.findMany({
      where: {
        type: DocumentType.INSURANCE,
        expiresAt: {
          not: null,
          lte: thresholdDate,
        },
        carId: { not: null },
      },
      include: {
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
      },
      orderBy: {
        expiresAt: 'asc',
      },
    });

    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const result: ExpiringInsuranceDto[] = [];

    for (const insurance of insurances) {
      if (!insurance.expiresAt || !insurance.car) continue;

      const expiresAt = new Date(insurance.expiresAt);
      expiresAt.setHours(0, 0, 0, 0);

      const daysUntilExpiry = Math.floor(
        (expiresAt.getTime() - now.getTime()) / MS_PER_DAY,
      );

      let status: 'critical' | 'expiring' | 'expired';
      if (daysUntilExpiry < 0) {
        status = 'expired';
      } else if (daysUntilExpiry <= 1) {
        status = 'critical';
      } else {
        status = 'expiring';
      }

      const car = insurance.car;
      const carName = `${car.make} ${car.model} ${car.year}`.trim();

      result.push({
        carId: car.id,
        carName,
        licensePlate: car.licensePlate ?? undefined,
        insuranceId: insurance.id,
        expiresAt,
        daysUntilExpiry,
        status,
      });
    }

    return result;
  }

  async getCarInsurance(carId: string) {
    const car = await this.prisma.car.findUnique({
      where: { id: carId },
      select: { id: true, make: true, model: true },
    });

    if (!car) {
      throw new NotFoundException('Машина не найдена');
    }

    const insurances = await this.prisma.document.findMany({
      where: {
        carId,
        type: DocumentType.INSURANCE,
      },
      orderBy: { expiresAt: 'desc' },
    });

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return insurances.map((doc) => {
      const expiresAt = doc.expiresAt ? new Date(doc.expiresAt) : null;
      const isExpired = expiresAt ? expiresAt < now : false;
      const isExpiringSoon =
        expiresAt && !isExpired
          ? (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 7
          : false;

      return {
        ...doc,
        isExpired,
        isExpiringSoon,
      };
    });
  }
}
