import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  MaxLength,
} from 'class-validator';
import { ExpenseType } from '@prisma/client';

export class CreateExpenseDto {
  @IsEnum(ExpenseType)
  type!: ExpenseType;

  @IsOptional()
  @IsString()
  @MaxLength(2000, {
    message: 'Длина комментария не должна быть больше 2000 символов',
  })
  comments?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notes?: string[];

  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsString()
  carId?: string;
}
