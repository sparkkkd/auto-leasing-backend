import { IsOptional, IsString, IsInt, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DealStatus } from '@prisma/client';

export class FindAllDealsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  investorId?: string;

  @IsOptional()
  @IsEnum(DealStatus, {
    message: 'Статус должен быть DRAFT, ACTIVE, COMPLETED или CANCELLED',
  })
  status?: DealStatus;

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
