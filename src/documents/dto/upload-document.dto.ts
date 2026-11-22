import { IsString, IsOptional, IsEnum } from 'class-validator';
import { DocumentType } from '@prisma/client';

export class UploadDocumentDto {
  @IsOptional()
  @IsString()
  paymentId?: string;

  @IsOptional()
  @IsString()
  dealId?: string;

  @IsEnum(DocumentType, {
    message:
      'Тип должен быть CLIENT_DOCUMENT, INVESTOR_DOCUMENT, CONTRACT_SCAN, PAYMENT_RECEIPT или OTHER',
  })
  type!: DocumentType;
}
