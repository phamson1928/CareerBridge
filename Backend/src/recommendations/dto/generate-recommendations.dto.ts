import { IsBoolean, IsOptional } from 'class-validator';

export class GenerateRecommendationsDto {
  @IsOptional()
  @IsBoolean()
  force = false;
}
