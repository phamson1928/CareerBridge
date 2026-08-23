import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AdminDashboardQueryDto {
  @IsOptional()
  @IsString()
  semesterId?: string;

  /** Number of calendar months shown in the operational trend. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(3)
  @Max(12)
  months = 6;
}
