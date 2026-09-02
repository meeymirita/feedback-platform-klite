import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Authorized } from '@/auth/decorators/authorized.decorator';
import { Authorization } from '@/auth/decorators/auth.decorator';
import { UserRole } from '@/generated/prisma/enums';
import { CreateUserDto } from '@/user/dto/create-user.dto';
import { UpdateUserDto } from '@/user/dto/update-user.dto';
import { SetPasswordDto } from '@/user/dto/set-password.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Authorization()
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  public async findProfile(@Authorized('id') userId: string) {
    return this.userService.findById(userId);
  }

  // ── Всё ниже — только для ADMIN / MIRA ──────────────────────────────

  @Authorization(UserRole.ADMIN, UserRole.MIRA)
  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  @Authorization(UserRole.ADMIN, UserRole.MIRA)
  @Post('create-user')
  async create(@Body() dto: CreateUserDto) {
    const exists = await this.userService.findByEmail(dto.email);
    if (exists) {
      throw new ConflictException('Пользователь с таким email уже есть');
    }
    return this.userService.create(
      dto.email,
      dto.password,
      dto.displayName,
      dto.role,
    );
  }

  @Authorization(UserRole.ADMIN, UserRole.MIRA)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.updateProfile(id, dto);
  }

  @Authorization(UserRole.ADMIN, UserRole.MIRA)
  @Patch(':id/password')
  async setPassword(@Param('id') id: string, @Body() dto: SetPasswordDto) {
    return this.userService.setPassword(id, dto.password);
  }
}
