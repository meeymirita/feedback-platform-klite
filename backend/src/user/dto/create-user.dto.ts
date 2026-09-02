import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '@/generated/prisma/enums';

/**
 * DTO создания аккаунта сотрудника (ADMIN/MIRA через POST /users/create-user).
 */
export class CreateUserDto {
  /**
   * ФИО пользователя.
   * @example John Doe
   */
  @IsString({ message: 'Имя должно быть строкой.' })
  @IsNotEmpty({ message: 'Имя обязательно для заполнения.' })
  displayName!: string;

  /**
   * Email пользователя.
   * @example example@example.com
   */
  @IsString({ message: 'Email должен быть строкой.' })
  @IsEmail({}, { message: 'Некорректный формат email.' })
  @IsNotEmpty({ message: 'Email обязателен для заполнения.' })
  email!: string;

  /**
   * Пароль пользователя.
   * @example password123
   */
  @IsString({ message: 'Пароль должен быть строкой.' })
  @IsNotEmpty({ message: 'Пароль обязателен для заполнения.' })
  @MinLength(6, {
    message: 'Пароль должен содержать минимум 6 символов.',
  })
  password!: string;

  @IsIn([UserRole.USER, UserRole.ADMIN], {
    message: 'Роль: USER или ADMIN.',
  })
  role!: UserRole;
}
