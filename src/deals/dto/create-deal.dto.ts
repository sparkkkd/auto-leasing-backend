import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsInt,
  IsArray,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { DealStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateDealDto {
  @IsString()
  @MinLength(1, { message: 'Номер договора обязателен' })
  @MaxLength(50)
  contractNumber!: string;

  @IsDateString({}, { message: 'Некорректная дата начала' })
  startDate!: string;

  @IsDateString({}, { message: 'Некорректная дата окончания' })
  endDate!: string;

  @Type(() => Number)
  @IsInt({ message: 'Срок должен быть целым числом' })
  @Min(1, { message: 'Срок должен быть >= 1 месяца' })
  term!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Первый взнос должен быть числом' })
  @Min(0, { message: 'Первый взнос должен быть >= 0' })
  firstPayment!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Ежемесячный платёж должен быть числом' })
  @Min(0, { message: 'Ежемесячный платёж должен быть >= 0' })
  monthlyPayment!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Итоговая цена машины должна быть числом' })
  @Min(0, { message: 'Итоговая цена машины должна быть >= 0' })
  finalCarPrice!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Итоговая сумма клиента должна быть числом' })
  @Min(0, { message: 'Итоговая сумма клиента должна быть >= 0' })
  clientTotalAmount!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Итоговая сумма инвестора должна быть числом' })
  @Min(0, { message: 'Итоговая сумма инвестора должна быть >= 0' })
  investorTotalAmount!: number;

  @IsOptional()
  @IsEnum(DealStatus, {
    message:
      'Статус должен быть DRAFT, ACTIVE, COMPLETED, CANCELLED или TERMINATED',
  })
  status?: DealStatus;

  @IsString({ message: 'clientId обязателен' })
  clientId!: string;

  @IsString({ message: 'investorId обязателен' })
  investorId!: string;

  @IsString()
  carId!: string;

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
