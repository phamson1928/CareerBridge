import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { InternshipSkillItemDto } from '../../skills/dto/internship-skill-item.dto';

const trimOptional = (params: TransformFnParams): unknown =>
  typeof params.value === 'string' ? params.value.trim() || null : params.value;

export class UpdateInternshipTemplateDto {
  @IsOptional()
  @Transform(trimOptional)
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @Transform(trimOptional)
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
  @Transform(trimOptional)
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
  slotsDefault?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InternshipSkillItemDto)
  skills?: InternshipSkillItemDto[];
}
