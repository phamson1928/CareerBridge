import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trimOptionalString = ({ value }: TransformFnParams) =>
  typeof value === 'string' ? value.trim() || undefined : value;

export class ListAuditLogsQueryDto {
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
  @Transform(trimOptionalString)
  @IsString()
  @MaxLength(100)
  action?: string;

  @IsOptional()
  @Transform(trimOptionalString)
  @IsString()
  @MaxLength(100)
  entity?: string;

  @IsOptional()
  @Transform(trimOptionalString)
  @IsString()
  @MaxLength(191)
  entityId?: string;

  @IsOptional()
  @Transform(trimOptionalString)
  @IsString()
  @Matches(/^c[a-z0-9]{24}$/)
  userId?: string;

  @IsOptional()
  @Transform(trimOptionalString)
  @IsISO8601({ strict: true })
  from?: string;

  @IsOptional()
  @Transform(trimOptionalString)
  @IsISO8601({ strict: true })
  to?: string;

  @IsOptional()
  @Transform(trimOptionalString)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  search?: string;
}