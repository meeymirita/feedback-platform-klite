import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Authorized } from '@/auth/decorators/authorized.decorator';
import { Authorization } from '@/auth/decorators/auth.decorator';
import { UserRole } from '@/generated/prisma/enums';
import { CreateUserDto } from '@/user/dto/create-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Authorization()
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  public async findProfile(@Authorized('id') userId: string) {
    return this.userService.findById(userId);
  }

  @Authorization(UserRole.ADMIN, UserRole.MIRA) // оба могут
  @Post('create-user')
  async create(@Body() dto: CreateUserDto) {
    const exists = await this.userService.findByEmail(dto.email);
    if (exists)
      throw new ConflictException('Пользователь с таким email уже есть');
    return this.userService.create(
      dto.email,
      dto.password,
      dto.displayName,
      dto.role,
    );
  }
}
