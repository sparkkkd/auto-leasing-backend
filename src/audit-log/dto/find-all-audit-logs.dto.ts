import { IsOptional, IsString, IsInt, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AuditAction, EntityType } from '@prisma/client';

export class FindAllAuditLogsDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsEnum(EntityType, {
    message:
      'Тип сущности должен быть USER, CLIENT, INVESTOR, CAR, DEAL, PAYMENT или DOCUMENT',
  })
  entityType?: EntityType;

  @IsOptional()
  @IsEnum(AuditAction, {
    message: 'Действие должно быть CREATE, UPDATE, DELETE, LOGIN или LOGOUT',
  })
  action?: AuditAction;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
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
  limit?: number = 50;
}
