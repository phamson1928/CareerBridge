import { IsDateString, IsOptional } from 'class-validator';

/** Administrative schedule changes for a placement that has not ended. */
export class UpdatePlacementDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
