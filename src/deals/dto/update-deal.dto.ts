import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  IsArray,
  Min,
  MaxLength,
  IsInt,
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
  @IsInt({ message: 'Срок должен быть целым числом' })
  @Min(1, { message: 'Срок должен быть >= 1 месяца' })
  term?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Первый взнос должен быть числом' })
  @Min(0, { message: 'Первый взнос должен быть >= 0' })
  firstPayment?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Ежемесячный платёж должен быть числом' })
  @Min(0, { message: 'Ежемесячный платёж должен быть >= 0' })
  monthlyPayment?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Итоговая цена машины должна быть числом' })
  @Min(0, { message: 'Итоговая цена машины должна быть >= 0' })
  finalCarPrice?: number;

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
    message:
      'Статус должен быть DRAFT, ACTIVE, COMPLETED, CANCELLED или TERMINATED',
  })
  status?: DealStatus;

  @IsOptional()
  @IsString()
  investorId?: string;

  @IsOptional()
  @IsString()
  contractScanId?: string;

  @IsOptional()
  @IsString()
  investorContractScanId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Комментарий не должен превышать 2000 символов' })
  comments?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: 'Каждая заметка должна быть строкой' })
  notes?: string[];
}
