import { Module } from '@nestjs/common';
import { ReportEntryService } from './report-entry.service';
import { ReportEntryController } from './report-entry.controller';
import { UserModule } from '@/user/user.module';

@Module({
  imports: [UserModule], // AuthGuard внутри @Authorization() тянет UserService
  controllers: [ReportEntryController],
  providers: [ReportEntryService],
})
export class ReportEntryModule {}
