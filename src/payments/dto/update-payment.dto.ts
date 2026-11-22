import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  MaxLength,
  IsString,
} from 'class-validator';
import { PaymentDirection } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdatePaymentDto {
  @IsOptional()
  @IsEnum(PaymentDirection, {
    message:
      'Направление должно быть CLIENT_TO_COMPANY (клиентом компании) или COMPANY_TO_INVESTOR (компанией инвестору)',
  })
  direction?: PaymentDirection;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Сумма должна быть числом' })
  @Min(0.01, { message: 'Сумма должна быть больше 0' })
  amount?: number;

  @IsOptional()
  @IsDateString({}, { message: 'paidAt должна быть в формате ISO 8601' })
  paidAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
