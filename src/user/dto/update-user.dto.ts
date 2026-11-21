import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'Некорректный email' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Пароль должен быть минимум 6 символов' })
  password?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Имя обязательно' })
  name?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Роль должна быть ADMIN, MANAGER или VIEWER' })
  role?: UserRole;

  @IsOptional()
  @IsBoolean({ message: 'isActive должен быть boolean' })
  isActive?: boolean;
}
