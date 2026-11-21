import {
  IsString,
  IsOptional,
  IsEmail,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateClientDto {
  @IsString()
  @MinLength(1, { message: 'Имя обязательно' })
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MinLength(1, { message: 'Фамилия обязательна' })
  @MaxLength(100)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string;

  @IsString()
  @MinLength(5, { message: 'Телефон обязателен' })
  @MaxLength(20)
  phone!: string;

  @IsOptional()
  @IsEmail({}, { message: 'Некорректный email' })
  email?: string;

  @IsString()
  @MinLength(1, { message: 'Паспортные данные обязательны' })
  @MaxLength(500)
  passportData!: string;

  @IsString()
  @MinLength(1, { message: 'Адрес обязателен' })
  @MaxLength(500)
  address!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
