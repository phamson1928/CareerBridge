import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { InternshipModerationReasonCode } from '../../generated/prisma/client';

export enum ModerationActionType {
  REJECT = 'REJECT',
  REQUEST_REVISION = 'REQUEST_REVISION',
  RESTORE = 'RESTORE',
}

export class ModerateInternshipDto {
  @IsEnum(ModerationActionType)
  action: ModerationActionType;

  @IsOptional()
  @IsEnum(InternshipModerationReasonCode)
  reasonCode?: InternshipModerationReasonCode;

  @IsString()
  @MinLength(10, { message: 'Lý do/Ghi chú kiểm duyệt tối thiểu 10 ký tự' })
  @MaxLength(1000, { message: 'Lý do/Ghi chú kiểm duyệt tối đa 1000 ký tự' })
  reasonDetail: string;

  @IsOptional()
  @IsBoolean()
  notifyApplicants?: boolean = true;
}
