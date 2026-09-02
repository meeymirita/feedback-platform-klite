import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { hash } from 'argon2';
import { UserRole } from '@/generated/prisma/enums';

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

  public async create(
    email: string,
    password: string,
    displayName: string,
    role: UserRole = UserRole.USER,
  ) {
    return this.prisnaService.user.create({
      data: {
        email,
        password: await hash(password),
        displayName,
        role,
      },
      omit: { password: true },
    });
  }

  findAll() {
    return this.prisnaService.user.findMany({
      where: { role: { not: UserRole.MIRA } },
      omit: { password: true },
      orderBy: { createdAt: 'desc' },
    });
  }
  async updateProfile(
    id: string,
    data: { displayName?: string; role?: UserRole },
  ) {
    await this.assertEditable(id);
    // берём только разрешённые поля (undefined Prisma игнорирует)
    return this.prisnaService.user.update({
      where: { id },
      data: { displayName: data.displayName, role: data.role },
      omit: { password: true },
    });
  }

  async setPassword(id: string, password: string) {
    await this.assertEditable(id);
    return this.prisnaService.user.update({
      where: { id },
      data: { password: await hash(password) },
      omit: { password: true },
    });
  }

  private async assertEditable(id: string) {
    const user = await this.prisnaService.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Пользователь не найден');
    if (user.role === UserRole.MIRA)
      throw new ForbiddenException('Владельца менять нельзя');
  }
}
