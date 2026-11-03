import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AiWorkerHeartbeatDto {
  @IsOptional()
  @IsString({ message: 'Tên model phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Tên model không được vượt quá 100 ký tự' })
  modelName?: string;
}
