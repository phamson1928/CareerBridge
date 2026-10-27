import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { SupportRequestStatus } from '../../generated/prisma/client';

export class ListSupportRequestsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsOptional()
  @IsEnum(SupportRequestStatus)
  status?: SupportRequestStatus;

  @IsOptional()
  @IsString()
  search?: string;
}
