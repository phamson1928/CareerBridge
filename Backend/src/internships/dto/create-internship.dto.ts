import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { InternshipStatus } from '../../generated/prisma/client';

const trim = (params: TransformFnParams): unknown =>
  typeof params.value === 'string' ? params.value.trim() : params.value;
const trimOptional = (params: TransformFnParams): unknown =>
  typeof params.value === 'string' ? params.value.trim() || null : params.value;

export class CreateInternshipDto {
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @Transform(trimOptional)
  @IsString()
  semesterId?: string | null;

  @IsOptional()
  @Transform(trimOptional)
  @IsString()
  @MaxLength(150)
  department?: string | null;

  @IsOptional()
  @Transform(trimOptional)
  @IsString()
  @MaxLength(250)
  location?: string | null;

  @IsOptional()
  @Transform(trimOptional)
  @IsString()
  @MaxLength(50)
  workType?: string | null;

  @IsOptional()
  @Transform(trimOptional)
  @IsString()
  @MaxLength(100)
  stipend?: string | null;

  @Transform(trim)
  @IsString()
  @MaxLength(10000)
  description!: string;

  @IsOptional()
  @Transform(trimOptional)
  @IsString()
  @MaxLength(5000)
  requirements?: string | null;

  @IsInt()
  @Min(1)
  @Max(10000)
  slots!: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  deadline?: Date | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date | null;

  @IsOptional()
  @IsEnum(InternshipStatus)
  status?: InternshipStatus;
}
