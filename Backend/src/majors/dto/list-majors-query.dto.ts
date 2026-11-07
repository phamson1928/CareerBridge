import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }
  return undefined;
}

export class ListMajorsQueryDto {
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
  @Transform(({ value }: { value: unknown }): string | undefined =>
    typeof value === 'string' ? value.trim() || undefined : undefined,
  )
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }): string | undefined =>
    typeof value === 'string' ? value.trim() || undefined : undefined,
  )
  @IsString()
  facultyId?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => parseOptionalBoolean(value))
  @IsBoolean()
  isActive?: boolean;
}
