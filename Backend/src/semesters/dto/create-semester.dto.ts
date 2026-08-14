import { Transform, TransformFnParams } from 'class-transformer';
import { IsDateString, IsString, MaxLength, MinLength } from 'class-validator';

const normalizeText = (params: TransformFnParams): unknown =>
  typeof params.value === 'string'
    ? params.value.trim().replace(/\s+/g, ' ')
    : params.value;

export class CreateSemesterDto {
  @Transform(normalizeText)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}
