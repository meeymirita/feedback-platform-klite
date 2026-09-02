import { IsString, MinLength } from 'class-validator';

/**
 * DTO сброса пароля сотрудника админом: PATCH /users/:id/password
 */
export class SetPasswordDto {
  @IsString({ message: 'Пароль должен быть строкой.' })
  @MinLength(6, { message: 'Пароль минимум 6 символов.' })
  password!: string;
}
