import {
  IsString,
  IsOptional,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
  IsArray,
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
  @Matches(
    /^\+?[78][\s-]?\(?[0-9]{3}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/,
    {
      message: 'Некорректный формат телефона',
    },
  )
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
  @MaxLength(2000, { message: 'Комментарий не должен превышать 2000 символов' })
  comments?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: 'Каждая заметка должна быть строкой' })
  notes?: string[];
}
