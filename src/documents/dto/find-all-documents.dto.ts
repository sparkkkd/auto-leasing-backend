import { IsOptional, IsString, IsInt, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentType } from '@prisma/client';

export class FindAllDocumentsDto {
  @IsOptional()
  @IsString()
  paymentId?: string;

  @IsOptional()
  @IsString()
  dealId?: string;

  @IsOptional()
  @IsEnum(DocumentType, {
    message:
      'Тип должен быть CLIENT_DOCUMENT, INVESTOR_DOCUMENT, CONTRACT_SCAN, PAYMENT_RECEIPT или OTHER',
  })
  type?: DocumentType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
