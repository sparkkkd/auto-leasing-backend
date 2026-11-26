import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { ExpenseType } from '@prisma/client';

export class CreateExpenseDto {
  @IsEnum(ExpenseType)
  type!: ExpenseType;

  @IsString()
  note!: string;

  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsString()
  carId?: string;
}
