import { PartialType } from '@nestjs/mapped-types';
import { CreateReportEntryDto } from './create-report-entry.dto';

/**
 * DTO правки записи: PATCH /report-entries/:id. Все поля необязательные.
 */
export class UpdateReportEntryDto extends PartialType(CreateReportEntryDto) {}
