import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { InternshipSkillItemDto } from '../../skills/dto/internship-skill-item.dto';

const trim = (params: TransformFnParams): unknown =>
  typeof params.value === 'string' ? params.value.trim() : params.value;
const trimOptional = (params: TransformFnParams): unknown =>
  typeof params.value === 'string' ? params.value.trim() || null : params.value;

export class CreateInternshipTemplateDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

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
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(10000)
  description!: string;

  @IsOptional()
  @Transform(trimOptional)
  @IsString()
  @MaxLength(5000)
  requirements?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  slotsDefault?: number = 1;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InternshipSkillItemDto)
  skills?: InternshipSkillItemDto[];
}
