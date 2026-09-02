import { Controller, Get, Query } from '@nestjs/common';
import { Authorization } from '@/auth/decorators/auth.decorator';
import { UserRole } from '@/generated/prisma/enums';
import { ReportEntryService } from './report-entry.service';
import { RangeQueryDto } from './dto/range-query.dto';
import { UserRangeQueryDto } from './dto/user-range-query.dto';

// Отчёты для руководителя. Только ADMIN / MIRA.
@Authorization(UserRole.ADMIN, UserRole.MIRA)
@Controller('reports')
export class ReportsController {
  public constructor(private readonly service: ReportEntryService) {}

  // Сводка по всем сотрудникам за период.
  @Get('summary')
  summary(@Query() q: RangeQueryDto) {
    return this.service.summary(q.from, q.to);
  }

  // Записи конкретного сотрудника за период (просмотр чужого недельного отчёта).
  @Get('entries')
  userEntries(@Query() q: UserRangeQueryDto) {
    return this.service.findRange(q.userId, q.from, q.to);
  }
}
