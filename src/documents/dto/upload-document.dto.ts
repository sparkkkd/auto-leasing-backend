import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  MaxLength,
  IsDateString,
  MinLength,
  Min,
  IsInt,
} from 'class-validator';
import { DocumentType } from '@prisma/client';

export class UploadDocumentDto {
  @IsString()
  @MinLength(1, { message: 'Имя файла обязательно' })
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @MinLength(1, { message: 'Оригинальное имя обязательно' })
  @MaxLength(255)
  originalName!: string;

  @IsString()
  @MinLength(1, { message: 'MIME тип обязателен' })
  @MaxLength(100)
  mimeType!: string;

  @IsInt({ message: 'Размер должен быть целым числом' })
  @Min(0, { message: 'Размер должен быть >= 0' })
  size!: number;

  @IsString()
  @MinLength(1, { message: 'Путь хранения обязателен' })
  @MaxLength(500)
  storagePath!: string;

  @IsEnum(DocumentType, {
    message:
      'Тип должен быть CLIENT_DOCUMENT, INVESTOR_DOCUMENT, CONTRACT_SCAN, PAYMENT_RECEIPT, PTS, STS, INSURANCE, INVESTMENT_CONTRACT, DCP или OTHER',
  })
  type!: DocumentType;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  investorId?: string;

  @IsOptional()
  @IsString()
  dealId?: string;

  @IsOptional()
  @IsString()
  paymentId?: string;

  @IsOptional()
  @IsString()
  carId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Некорректная дата окончания' })
  expiresAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Комментарий не должен превышать 2000 символов' })
  comments?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: 'Каждая заметка должна быть строкой' })
  notes?: string[];
}
