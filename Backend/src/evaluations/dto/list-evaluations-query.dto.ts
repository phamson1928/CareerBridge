import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { EvaluationType } from '../../generated/prisma/client';

export class ListEvaluationsQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
  @IsOptional() @IsString() placementId?: string;
  @IsOptional() @IsEnum(EvaluationType) type?: EvaluationType;
}
