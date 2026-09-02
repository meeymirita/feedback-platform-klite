import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UserService } from '@/user/user.service';
import { CreateReportEntryDto } from './dto/create-report-entry.dto';
import { UpdateReportEntryDto } from './dto/update-report-entry.dto';

@Injectable()
export class ReportEntryService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  // Записи одного пользователя за период [from, to] включительно.
  findRange(userId: string, from: string, to: string) {
    return this.prisma.reportEntry.findMany({
      where: {
        userId,
        date: { gte: new Date(from), lte: new Date(to) },
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });
  }

  // Сводка по всем сотрудникам (кроме MIRA) за период: сколько записей и минут
  // у каждого. Сотрудники без записей тоже в списке — с нулями.
  async summary(from: string, to: string) {
    const users = await this.userService.findAll(); // без MIRA
    const grouped = await this.prisma.reportEntry.groupBy({
      by: ['userId'],
      where: { date: { gte: new Date(from), lte: new Date(to) } },
      _count: { _all: true },
      _sum: { minutes: true },
    });
    const byUser = new Map(grouped.map((g) => [g.userId, g]));
    return users.map((u) => {
      const g = byUser.get(u.id);
      return {
        userId: u.id,
        displayName: u.displayName,
        count: g?._count._all ?? 0,
        minutes: g?._sum.minutes ?? 0,
      };
    });
  }

  create(userId: string, dto: CreateReportEntryDto) {
    return this.prisma.reportEntry.create({
      data: {
        userId,
        date: new Date(dto.date),
        domain: dto.domain,
        link: dto.link ?? '',
        description: dto.description,
        minutes: dto.minutes,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateReportEntryDto) {
    await this.assertOwner(userId, id);
    return this.prisma.reportEntry.update({
      where: { id },
      data: {
        date: dto.date ? new Date(dto.date) : undefined,
        domain: dto.domain,
        link: dto.link,
        description: dto.description,
        minutes: dto.minutes,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.assertOwner(userId, id);
    await this.prisma.reportEntry.delete({ where: { id } });
  }

  // запись существует и принадлежит этому пользователю
  private async assertOwner(userId: string, id: string) {
    const entry = await this.prisma.reportEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Запись не найдена');
    if (entry.userId !== userId) {
      throw new ForbiddenException('Это не ваша запись');
    }
  }
}
