import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { InternshipReportReasonCode } from '../../generated/prisma/client';

export class CreateInternshipReportDto {
  @IsEnum(InternshipReportReasonCode, {
    message: 'Mã lý do báo cáo không hợp lệ',
  })
  reasonCode: InternshipReportReasonCode;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Nội dung chi tiết tối đa 1000 ký tự' })
  reasonDetail?: string;
}
