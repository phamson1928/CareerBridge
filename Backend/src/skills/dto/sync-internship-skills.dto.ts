import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDefined,
  ValidateNested,
} from 'class-validator';
import { InternshipSkillItemDto } from './internship-skill-item.dto';

export class SyncInternshipSkillsDto {
  @IsArray()
  @IsDefined()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => InternshipSkillItemDto)
  skills!: InternshipSkillItemDto[];
}
