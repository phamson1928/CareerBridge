import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum ReviewReportStatus {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
export class ReviewReportDto {
  @IsEnum(ReviewReportStatus) status!: ReviewReportStatus;
  @IsOptional() @IsString() @MaxLength(1000) feedback?: string;
}
