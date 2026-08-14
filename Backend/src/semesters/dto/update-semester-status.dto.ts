import { IsEnum } from 'class-validator';
import { SemesterStatus } from '../../generated/prisma/client';

export class UpdateSemesterStatusDto {
  @IsEnum(SemesterStatus)
  status!: SemesterStatus;
}
