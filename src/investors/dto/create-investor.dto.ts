import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { InvestorType } from '@prisma/client';

export class CreateInvestorDto {
  @IsString()
  @MinLength(1, { message: 'Название инвестора обязательно' })
  @MaxLength(200)
  name!: string;

  @IsEnum(InvestorType, {
    message: 'Тип инвестора должен быть INDIVIDUAL, COMPANY или BANK',
  })
  type!: InvestorType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  contactPerson?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Некорректный email' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bankDetails?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
