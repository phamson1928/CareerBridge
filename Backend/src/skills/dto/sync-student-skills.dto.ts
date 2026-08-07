import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDefined,
  ValidateNested,
} from 'class-validator';
import { StudentSkillItemDto } from './student-skill-item.dto';

export class SyncStudentSkillsDto {
  @IsArray()
  @IsDefined()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => StudentSkillItemDto)
  skills!: StudentSkillItemDto[];
}
