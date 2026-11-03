import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAiWorkerDto {
  @IsNotEmpty({ message: 'Tên worker không được để trống' })
  @IsString({ message: 'Tên worker phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Tên worker không được vượt quá 100 ký tự' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Tên model phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Tên model không được vượt quá 100 ký tự' })
  modelName?: string;
}
