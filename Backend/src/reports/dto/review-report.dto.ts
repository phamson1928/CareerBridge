import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportStatus } from '../../generated/prisma/client';

export enum ReviewReportStatus { APPROVED = 'APPROVED', REJECTED = 'REJECTED' }
export class ReviewReportDto {
  @IsEnum(ReviewReportStatus) status!: ReviewReportStatus;
  @IsOptional() @IsString() @MaxLength(1000) feedback?: string;
}
