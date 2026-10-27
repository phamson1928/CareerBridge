import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { InterviewMode } from '../../generated/prisma/client';

export enum EmailPreviewKind {
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  REJECT = 'REJECT',
}

export class EmailPreviewQueryDto {
  @IsEnum(EmailPreviewKind)
  type!: EmailPreviewKind;

  @IsOptional()
  @IsString()
  scheduledAt?: string;

  @IsOptional()
  @IsEnum(InterviewMode)
  mode?: InterviewMode;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  meetingLink?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  contactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2)
  expiresInDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  offerMessage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  companyFeedback?: string;
}
