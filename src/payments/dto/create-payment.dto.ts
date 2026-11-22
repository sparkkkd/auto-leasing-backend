import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { PaymentDirection } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreatePaymentDto {
  @IsString({ message: 'dealId (номер сделки) должен быть строкой' })
  dealId!: string;

  @IsEnum(PaymentDirection, {
    message:
      'Направление должно быть CLIENT_TO_COMPANY (клиентом компании) или COMPANY_TO_INVESTOR (компанией инвестору)',
  })
  direction!: PaymentDirection;

  @Type(() => Number)
  @IsNumber({}, { message: 'Сумма должна быть числом' })
  @Min(0.01, { message: 'Сумма должна быть больше 0' })
  amount!: number;

  @IsDateString({}, { message: 'paidAt должна быть в формате ISO 8601' })
  paidAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
