import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@/generated/prisma/enums';

/**
 * DTO правки сотрудника: PATCH /users/:id. Email (логин) не меняем.
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  displayName?: string;

  @IsOptional()
  @IsIn([UserRole.USER, UserRole.ADMIN], { message: 'Роль: USER или ADMIN.' })
  role?: UserRole;
}
