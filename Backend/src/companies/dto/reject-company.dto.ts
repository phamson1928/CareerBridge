import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CompanyRejectionReasonCode } from '../../generated/prisma/client';

export class RejectCompanyDto {
  @IsEnum(CompanyRejectionReasonCode)
  reasonCode!: CompanyRejectionReasonCode;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  reasonDetail!: string;
}
