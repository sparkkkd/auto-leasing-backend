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

export class CreateDealDto {
  @IsString({ message: 'clientId должен быть строкой' })
  clientId!: string;

  @IsString({ message: 'carId должен быть строкой' })
  carId!: string;

  @IsString({ message: 'investorId должен быть строкой' })
  investorId!: string;

  @IsString({ message: 'Номер договора обязателен' })
  @MaxLength(100)
  contractNumber!: string;

  @IsDateString({}, { message: 'startDate должна быть в формате ISO 8601' })
  startDate!: string;

  @IsDateString({}, { message: 'endDate должна быть в формате ISO 8601' })
  endDate!: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Итоговоя сумма клиента должна быть числом' })
  @Min(0.01, { message: 'Итоговоя сумма клиента должна быть больше 0' })
  clientTotalAmount!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Итоговоя сумма инвестору должна быть числом' })
  @Min(0.01, { message: 'Итоговоя сумма инвестору должна быть больше 0' })
  investorTotalAmount!: number;

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
