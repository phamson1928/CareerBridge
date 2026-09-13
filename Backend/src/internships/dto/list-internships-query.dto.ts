import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsEnum,
  IsInt,
  IsArray,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { InternshipStatus } from '../../generated/prisma/client';

const toStringArray = (params: TransformFnParams): unknown => {
  if (
    params.value === undefined ||
    params.value === null ||
    params.value === ''
  ) {
    return undefined;
  }

  const values = Array.isArray(params.value) ? params.value : [params.value];
  return [
    ...new Set(
      values
        .flatMap((value) => (typeof value === 'string' ? value.split(',') : []))
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
};

export class ListInternshipsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsOptional()
  @Transform((params: TransformFnParams): unknown =>
    typeof params.value === 'string'
      ? params.value.trim() || undefined
      : params.value,
  )
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsString()
  semesterId?: string;

  @IsOptional()
  @IsString()
  skillId?: string;

  @IsOptional()
  @Transform(toStringArray)
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  skillIds?: string[];

  @IsOptional()
  @IsEnum(InternshipStatus)
  status?: InternshipStatus;
}
