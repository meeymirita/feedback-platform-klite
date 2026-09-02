import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/**
 * DTO создания записи отчёта: POST /report-entries
 */
export class CreateReportEntryDto {
  @IsDateString({}, { message: 'Дата в формате YYYY-MM-DD.' })
  date!: string;

  @IsString()
  @IsNotEmpty({ message: 'Домен обязателен.' })
  domain!: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsString()
  @IsNotEmpty({ message: 'Опишите, что сделано.' })
  description!: string;

  @IsInt({ message: 'Время — целое число минут.' })
  @Min(1, { message: 'Время должно быть больше нуля.' })
  minutes!: number;
}
