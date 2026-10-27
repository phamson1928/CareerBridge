import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { InterviewMode } from '../../generated/prisma/client';

const trim = (params: TransformFnParams): unknown =>
  typeof params.value === 'string' ? params.value.trim() : params.value;

export class ScheduleInterviewDto {
  @IsDateString()
  scheduledAt!: string;

  @IsEnum(InterviewMode)
  mode!: InterviewMode;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  meetingLink?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  location?: string;

  @Transform(trim)
  @IsString()
  @MaxLength(150)
  contactName!: string;

  @Transform(trim)
  @IsEmail()
  @MaxLength(200)
  contactEmail!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(50)
  contactPhone?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  note?: string;
}
