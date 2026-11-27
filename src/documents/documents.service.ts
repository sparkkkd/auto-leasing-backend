import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DocumentType, Prisma } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { FindAllDocumentsDto, UploadDocumentDto } from './dto';
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

  private getAbsolutePath(storagePath: string): string {
    return path.join(process.cwd(), storagePath);
  }

  async upload(file: UploadedFile, dto: UploadDocumentDto) {
    if (
      !dto.carId &&
      !dto.dealId &&
      !dto.paymentId &&
      !dto.clientId &&
      !dto.investorId
    ) {
      throw new BadRequestException(
        'Документ должен быть привязан хотя бы к одной сущности (carId, dealId, paymentId, clientId или investorId)',
      );
    }

    if (dto.carId) {
      const car = await this.prisma.car.findUnique({
        where: { id: dto.carId },
      });
      if (!car) throw new NotFoundException('Машина не найдена');
    }

    if (dto.paymentId) {
      const payment = await this.prisma.payment.findUnique({
        where: { id: dto.paymentId },
      });
      if (!payment) {
        throw new NotFoundException('Платеж не найден');
      }
    }

    if (dto.dealId) {
      const deal = await this.prisma.deal.findUnique({
        where: { id: dto.dealId },
      });
      if (!deal) {
        throw new NotFoundException('Сделка не найдена');
      }
    }

    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;

    const absolutePath = path.join(this.uploadDir, uniqueName);
    const relativeStoragePath = `/uploads/${uniqueName}`;

    await fs.writeFile(absolutePath, file.buffer);

    const document = await this.prisma.document.create({
      data: {
        fileName: uniqueName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storagePath: relativeStoragePath,
        type: dto.type,
        carId: dto.carId || null,
        clientId: dto.clientId || null,
        investorId: dto.investorId || null,
        dealId: dto.dealId || null,
        paymentId: dto.paymentId || null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        comments: dto.comments || null,
        notes: dto.notes || [],
      },
      include: {
        car: { select: { id: true, make: true, model: true } },
        deal: { select: { id: true, contractNumber: true } },
      },
    });

    return document;
  }

  async findAll(query: FindAllDocumentsDto) {
    const {
      clientId,
      investorId,
      dealId,
      paymentId,
      carId,
      type,
      page = 1,
      limit = 20,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DocumentWhereInput = {
      ...(clientId && { clientId }),
      ...(investorId && { investorId }),
      ...(dealId && { dealId }),
      ...(paymentId && { paymentId }),
      ...(carId && { carId }),
      ...(type && { type }),
    };

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          car: {
            select: {
              id: true,
              make: true,
              model: true,
              licensePlate: true,
              vin: true,
            },
          },
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
        car: {
          select: {
            id: true,
            make: true,
            model: true,
            licensePlate: true,
            vin: true,
          },
        },
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
      const absolutePath = this.getAbsolutePath(document.storagePath);
      const fileBuffer = await fs.readFile(absolutePath);
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
      const absolutePath = this.getAbsolutePath(document.storagePath);
      await fs.unlink(absolutePath);
    } catch {
      //
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
