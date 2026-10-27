import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { InternshipStatus } from '../../generated/prisma/client';
import { InternshipSkillItemDto } from '../../skills/dto/internship-skill-item.dto';

const trim = (params: TransformFnParams): unknown =>
  typeof params.value === 'string' ? params.value.trim() : params.value;
const trimOptional = (params: TransformFnParams): unknown =>
  typeof params.value === 'string' ? params.value.trim() || null : params.value;

export class RepostInternshipDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  semesterId!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  title?: string;

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

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(10000)
  description?: string;

  @IsOptional()
  @Transform(trimOptional)
  @IsString()
  @MaxLength(5000)
  requirements?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  slots?: number;

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InternshipSkillItemDto)
  skills?: InternshipSkillItemDto[];
}
