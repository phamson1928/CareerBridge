import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { InternshipReportStatus } from '../../generated/prisma/client';

export class ReviewInternshipReportDto {
  @IsEnum(InternshipReportStatus, {
    message: 'Trạng thái xử lý báo cáo không hợp lệ',
  })
  status: InternshipReportStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Ghi chú xử lý tối đa 1000 ký tự' })
  adminNotes?: string;
}
