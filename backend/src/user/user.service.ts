import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { hash } from 'argon2';
import { AuthMethod } from '@/generated/prisma/enums';

@Injectable()
export class UserService {
  public constructor(private readonly prisnaService: PrismaService) {}

  public async findById(id: string) {
    const user = await this.prisnaService.user.findUnique({
      where: {
        id: id,
      },
      include: {
        accounts: true,
      },
    });

    if (!user) {
      throw new NotFoundException(
        'Пользователь не найден. Пожалуйста проверьте введенные данные.',
      );
    }
    return user;
  }

  public async findByEmail(email: string) {
    const user = await this.prisnaService.user.findUnique({
      where: {
        email,
      },
      include: {
        accounts: true,
      },
    });
    return user;
  }

  public async create(
    email: string,
    password: string,
    displayName: string,
    picture: string,
    method: AuthMethod,
    isVerified: boolean,
  ) {
    const user = await this.prisnaService.user.create({
      data: {
        email,
        password: password ? await hash(password) : '',
        displayName,
        picture,
        method,
        isVerified,
      },
      include: {
        accounts: true,
      },
    });
    return user;
  }
}
