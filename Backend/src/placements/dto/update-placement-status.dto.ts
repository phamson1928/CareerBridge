import { Transform, type TransformFnParams } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
export enum PublicPlacementStatus {
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class UpdatePlacementStatusDto {
  @IsEnum(PublicPlacementStatus)
  status!: PublicPlacementStatus;

  @IsOptional()
  @Transform((params: TransformFnParams) => {
    const value: unknown = params.value;
    return typeof value === 'string' ? value.trim() : value;
  })
  @IsString()
  @MaxLength(500)
  note?: string;
}
