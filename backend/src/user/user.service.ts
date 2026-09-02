import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { hash } from 'argon2';

@Injectable()
export class UserService {
  public constructor(private readonly prisnaService: PrismaService) {}

  public async findById(id: string) {
    const user = await this.prisnaService.user.findUnique({
      where: { id },
      omit: { password: true },
    });

    if (!user) {
      throw new NotFoundException(
        'Пользователь не найден. Пожалуйста проверьте введенные данные.',
      );
    }
    return user;
  }

  public async findByEmail(email: string) {
    return this.prisnaService.user.findUnique({
      where: { email },
    });
  }

  public async create(email: string, password: string, displayName: string) {
    return this.prisnaService.user.create({
      data: {
        email,
        password: await hash(password),
        displayName,
      },
      omit: { password: true },
    });
  }
}
