import { Transform, TransformFnParams } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateSkillDto {
  @IsOptional()
  @Transform((params: TransformFnParams): unknown =>
    typeof params.value === 'string'
      ? params.value.trim().replace(/\s+/g, ' ')
      : params.value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;
}
