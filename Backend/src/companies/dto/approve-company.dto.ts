import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsEnum, ValidateNested } from 'class-validator';
import { CompanyChecklistCode } from '../constants/company-verification.constants';

export class CompanyChecklistItemDto {
  @IsEnum(CompanyChecklistCode)
  code!: CompanyChecklistCode;

  @IsBoolean()
  checked!: boolean;
}

export class ApproveCompanyDto {
  @IsArray()
  @ArrayMinSize(6)
  @ValidateNested({ each: true })
  @Type(() => CompanyChecklistItemDto)
  checklist!: CompanyChecklistItemDto[];
}
