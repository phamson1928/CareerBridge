import { Transform, TransformFnParams, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { InternshipStatus } from '../../generated/prisma/client';

export class ListInternshipsQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit = 20;

  @IsOptional()
  @Transform((params: TransformFnParams): unknown => typeof params.value === 'string' ? params.value.trim() || undefined : params.value)
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional() @IsString()
  semesterId?: string;

  @IsOptional() @IsString()
  skillId?: string;

  @IsOptional() @IsEnum(InternshipStatus)
  status?: InternshipStatus;
}
