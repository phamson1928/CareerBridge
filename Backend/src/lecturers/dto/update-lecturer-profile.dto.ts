import { Transform, TransformFnParams } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLecturerProfileDto {
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
  department?: string;

  @IsOptional()
  @Transform((params: TransformFnParams): unknown =>
    typeof params.value === 'string'
      ? params.value.trim() || null
      : params.value,
  )
  @IsString()
  @MaxLength(100)
  title?: string | null;
}
