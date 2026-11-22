import {
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentDirection } from '@prisma/client';

export class FindAllPaymentsDto {
  @IsOptional()
  @IsString()
  dealId?: string;

  @IsOptional()
  @IsEnum(PaymentDirection, {
    message:
      'Направление должно быть CLIENT_TO_COMPANY (клиентом компании) или COMPANY_TO_INVESTOR (компанией инвестору)',
  })
  direction?: PaymentDirection;

  @IsOptional()
  @IsDateString({}, { message: 'dateFrom должна быть в формате ISO 8601' })
  dateFrom?: string;

  @IsOptional()
  @IsDateString({}, { message: 'dateTo должна быть в формате ISO 8601' })
  dateTo?: string;

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
