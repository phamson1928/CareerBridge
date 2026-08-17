import { IsEnum } from 'class-validator';

export enum PublicSupervisionStatus {
  CANCELLED = 'CANCELLED',
}

export class UpdateSupervisionStatusDto {
  @IsEnum(PublicSupervisionStatus)
  status!: PublicSupervisionStatus.CANCELLED;
}
