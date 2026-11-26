import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsArray,
  MaxLength,
  Min,
} from 'class-validator';
import { PaymentDirection } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreatePaymentDto {
  @IsEnum(PaymentDirection, {
    message:
      'Направление должно быть CLIENT_TO_COMPANY или COMPANY_TO_INVESTOR',
  })
  direction!: PaymentDirection;

  @Type(() => Number)
  @IsNumber({}, { message: 'Сумма должна быть числом' })
  @Min(0.01, { message: 'Сумма должна быть > 0' })
  amount!: number;

  @IsDateString({}, { message: 'Некорректная дата платежа' })
  paymentDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsString()
  dealId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Комментарий не должен превышать 2000 символов' })
  comments?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: 'Каждая заметка должна быть строкой' })
  notes?: string[];
}
