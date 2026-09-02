import { IsDateString } from 'class-validator';

/**
 * ?from=YYYY-MM-DD&to=YYYY-MM-DD — период выборки записей (обе даты включительно).
 */
export class RangeQueryDto {
  @IsDateString({}, { message: 'from в формате YYYY-MM-DD.' })
  from!: string;

  @IsDateString({}, { message: 'to в формате YYYY-MM-DD.' })
  to!: string;
}
