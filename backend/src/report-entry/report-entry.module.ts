import { Module } from '@nestjs/common';
import { ReportEntryService } from './report-entry.service';
import { ReportEntryController } from './report-entry.controller';
import { ReportsController } from './reports.controller';
import { UserModule } from '@/user/user.module';

@Module({
  imports: [UserModule], // UserService: и для AuthGuard, и для сводки
  controllers: [ReportEntryController, ReportsController],
  providers: [ReportEntryService],
})
export class ReportEntryModule {}
