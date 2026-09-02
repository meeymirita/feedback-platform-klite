import { IsNotEmpty, IsString } from 'class-validator';
import { RangeQueryDto } from './range-query.dto';

/**
 * ?userId=<id>&from=YYYY-MM-DD&to=YYYY-MM-DD — записи конкретного сотрудника
 * за период (для админского просмотра чужого отчёта).
 */
export class UserRangeQueryDto extends RangeQueryDto {
  @IsString()
  @IsNotEmpty({ message: 'userId обязателен.' })
  userId!: string;
}
