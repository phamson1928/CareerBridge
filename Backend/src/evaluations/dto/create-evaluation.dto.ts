import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateEvaluationDto {
  @IsString()
  placementId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10)
  score!: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
