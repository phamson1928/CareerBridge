import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateStudentProjectDto {
  @Transform((params: TransformFnParams): unknown =>
    typeof params.value === 'string' ? params.value.trim() : params.value,
  )
  @IsString()
  @MaxLength(150)
  title!: string;

  @IsOptional()
  @Transform((params: TransformFnParams): unknown =>
    typeof params.value === 'string' ? params.value.trim() || null : params.value,
  )
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'] })
  repositoryUrl?: string | null;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'] })
  demoUrl?: string | null;

  @IsOptional()
  @IsDateString()
  startedAt?: string | null;

  @IsOptional()
  @IsDateString()
  endedAt?: string | null;
}