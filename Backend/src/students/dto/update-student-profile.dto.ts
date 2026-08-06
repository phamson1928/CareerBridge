import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateStudentProfileDto {
  @IsOptional()
  @Transform((params: TransformFnParams): unknown =>
    typeof params.value === 'string' ? params.value.trim() : params.value,
  )
  @IsString()
  @MaxLength(50)
  studentCode?: string;

  @IsOptional()
  @Transform((params: TransformFnParams): unknown =>
    typeof params.value === 'string' ? params.value.trim() : params.value,
  )
  @IsString()
  @MaxLength(150)
  fullName?: string;

  @IsOptional()
  @Transform((params: TransformFnParams): unknown =>
    typeof params.value === 'string' ? params.value.trim() : params.value,
  )
  @IsString()
  @MaxLength(150)
  major?: string;

  @IsOptional()
  @Transform((params: TransformFnParams): unknown =>
    typeof params.value === 'string'
      ? params.value.trim() || null
      : params.value,
  )
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @IsOptional()
  @Transform((params: TransformFnParams): unknown =>
    typeof params.value === 'string'
      ? params.value.trim() || null
      : params.value,
  )
  @IsString()
  @MaxLength(2000)
  summary?: string | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(4)
  gpa?: number | null;

  @IsOptional()
  @IsString()
  cvFileId?: string | null;
}
