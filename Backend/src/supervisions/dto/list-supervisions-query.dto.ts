import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  PlacementStatus,
  SupervisionStatus,
} from '../../generated/prisma/client';

export class ListSupervisionsQueryDto {
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
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(SupervisionStatus)
  status?: SupervisionStatus;

  @IsOptional()
  @IsString()
  lecturerId?: string;

  @IsOptional()
  @IsEnum(PlacementStatus)
  placementStatus?: PlacementStatus;
}
