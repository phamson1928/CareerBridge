import { IsEnum, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { CompanySuspensionReasonCode } from '../../generated/prisma/client';

export class SuspendCompanyDto {
  @IsEnum(CompanySuspensionReasonCode)
  reasonCode!: CompanySuspensionReasonCode;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  reasonDetail!: string;
}
