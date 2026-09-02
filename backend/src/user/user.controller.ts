import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { Authorized } from '@/auth/decorators/authorized.decorator';
import { Authorization } from '@/auth/decorators/auth.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Authorization()
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  public async findProfile(@Authorized('id') userId: string) {
    return this.userService.findById(userId);
  }
}
