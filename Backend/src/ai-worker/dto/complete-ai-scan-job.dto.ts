import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AiCandidateRecommendation } from '../../generated/prisma/client';

export class CompleteAiScanJobDto {
  @IsNumber({}, { message: 'Điểm AI phải là số' })
  @Min(0, { message: 'Điểm AI tối thiểu là 0' })
  @Max(100, { message: 'Điểm AI tối đa là 100' })
  aiScore: number;

  @IsEnum(AiCandidateRecommendation, {
    message:
      'Khuyến nghị không hợp lệ (STRONG_HIRE, HIRE, POTENTIAL, NOT_RECOMMENDED)',
  })
  recommendation: AiCandidateRecommendation;

  @IsOptional()
  @IsNumber({}, { message: 'Số năm kinh nghiệm phải là số' })
  @Min(0, { message: 'Số năm kinh nghiệm không được âm' })
  experienceYears?: number;

  @IsOptional()
  @IsArray({ message: 'Danh sách kỹ năng bóc tách phải là mảng' })
  @IsString({ each: true, message: 'Mỗi kỹ năng bóc tách phải là chuỗi' })
  extractedSkills?: string[];

  @IsOptional()
  @IsArray({ message: 'Danh sách kỹ năng khớp phải là mảng' })
  @IsString({ each: true, message: 'Mỗi kỹ năng khớp phải là chuỗi' })
  matchedSkills?: string[];

  @IsOptional()
  @IsArray({ message: 'Danh sách kỹ năng còn thiếu phải là mảng' })
  @IsString({ each: true, message: 'Mỗi kỹ năng thiếu phải là chuỗi' })
  missingSkills?: string[];

  @IsOptional()
  @IsArray({ message: 'Danh sách điểm mạnh phải là mảng' })
  @IsString({ each: true, message: 'Mỗi điểm mạnh phải là chuỗi' })
  strengths?: string[];

  @IsOptional()
  @IsArray({ message: 'Danh sách điểm cần lưu ý phải là mảng' })
  @IsString({ each: true, message: 'Mỗi điểm lưu ý phải là chuỗi' })
  weaknesses?: string[];

  @IsOptional()
  @IsString({ message: 'Tóm tắt ứng viên phải là chuỗi ký tự' })
  @MaxLength(2000, { message: 'Tóm tắt không được vượt quá 2000 ký tự' })
  summary?: string;

  @IsOptional()
  rawAnalysis?: Record<string, unknown>;

  @IsOptional()
  @IsString({ message: 'Tên model phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Tên model không được vượt quá 100 ký tự' })
  modelUsed?: string;
}
