import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class FailAiScanJobDto {
  @IsNotEmpty({ message: 'Thông tin lỗi không được để trống' })
  @IsString({ message: 'Thông tin lỗi phải là chuỗi ký tự' })
  @MaxLength(1000, { message: 'Thông tin lỗi không được vượt quá 1000 ký tự' })
  errorMessage: string;
}
