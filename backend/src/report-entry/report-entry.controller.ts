import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Authorization } from '@/auth/decorators/auth.decorator';
import { Authorized } from '@/auth/decorators/authorized.decorator';
import { ReportEntryService } from './report-entry.service';
import { CreateReportEntryDto } from './dto/create-report-entry.dto';
import { UpdateReportEntryDto } from './dto/update-report-entry.dto';
import { RangeQueryDto } from './dto/range-query.dto';

// Свои записи. Любой залогиненный пользователь; правит/удаляет только свои.
@Authorization()
@Controller('report-entries')
export class ReportEntryController {
  public constructor(private readonly service: ReportEntryService) {}

  @Get()
  findRange(@Authorized('id') userId: string, @Query() q: RangeQueryDto) {
    return this.service.findRange(userId, q.from, q.to);
  }

  @Post()
  create(@Authorized('id') userId: string, @Body() dto: CreateReportEntryDto) {
    return this.service.create(userId, dto);
  }

  @Patch(':id')
  update(
    @Authorized('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReportEntryDto,
  ) {
    return this.service.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Authorized('id') userId: string, @Param('id') id: string) {
    return this.service.remove(userId, id);
  }
}
