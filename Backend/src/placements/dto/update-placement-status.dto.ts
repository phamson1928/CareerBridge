import { IsEnum } from 'class-validator';
export enum PublicPlacementStatus {
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class UpdatePlacementStatusDto {
  @IsEnum(PublicPlacementStatus)
  status!: PublicPlacementStatus;
}
