import { Transform, type TransformFnParams } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

const trim = (params: TransformFnParams): unknown =>
  typeof params.value === 'string' ? params.value.trim() : params.value;

export class RejectApplicationDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  rejectionReason?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  companyFeedback?: string;
}
