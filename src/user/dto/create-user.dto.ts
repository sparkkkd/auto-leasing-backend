import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsEmail({}, { message: 'Некорректный email' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Пароль должен состоять минимум из 6 символов' })
  password!: string;

  @IsString()
  @MinLength(1, { message: 'Имя обязательно' })
  name!: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Роль должна быть ADMIN, MANAGER или VIEWER' })
  role?: UserRole;
}
