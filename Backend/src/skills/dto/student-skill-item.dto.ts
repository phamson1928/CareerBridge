import { IsEnum, IsString, MinLength } from 'class-validator';
import { SkillLevel } from '../../generated/prisma/client';

export class StudentSkillItemDto {
  @IsString()
  @MinLength(1)
  skillId!: string;

  @IsEnum(SkillLevel)
  level!: SkillLevel;
}
