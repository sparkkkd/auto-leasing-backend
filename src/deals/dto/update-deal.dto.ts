import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { DealStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdateDealDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contractNumber?: string;

  @IsOptional()
  @IsDateString({}, { message: 'startDate должна быть в формате ISO 8601' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'endDate должна быть в формате ISO 8601' })
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Сумма клиента должна быть числом' })
  @Min(0.01, { message: 'Сумма клиента должна быть больше 0' })
  clientTotalAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Сумма инвестору должна быть числом' })
  @Min(0.01, { message: 'Сумма инвестору должна быть больше 0' })
  investorTotalAmount?: number;

  @IsOptional()
  @IsEnum(DealStatus, {
    message: 'Статус должен быть DRAFT, ACTIVE, COMPLETED или CANCELLED',
  })
  status?: DealStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
