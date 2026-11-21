import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsNumber,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { CarStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateCarDto {
  @IsString()
  @MinLength(1, { message: 'Марка обязательна' })
  @MaxLength(100)
  make!: string;

  @IsString()
  @MinLength(1, { message: 'Модель обязательна' })
  @MaxLength(100)
  model!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1900, { message: 'Год должен быть не раньше 1900' })
  @Max(2100, { message: 'Год должен быть не позже 2100' })
  year!: number;

  @IsString()
  @MinLength(17, { message: 'VIN должен содержать 17 символов' })
  @MaxLength(17, { message: 'VIN должен содержать 17 символов' })
  vin!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  licensePlate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @IsOptional()
  @IsEnum(CarStatus, {
    message: 'Статус должен быть IN_STOCK, IN_WORK, RESERVED, SOLD или REPAIR',
  })
  status?: CarStatus;

  @Type(() => Number)
  @IsNumber({}, { message: 'Цена покупки должна быть числом' })
  @Min(0, { message: 'Цена покупки должна быть >= 0' })
  purchasePrice!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Цена продажи должна быть числом' })
  @Min(0, { message: 'Цена продажи должна быть >= 0' })
  sellingPrice!: number;
}
