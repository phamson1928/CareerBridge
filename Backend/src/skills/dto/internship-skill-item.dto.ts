import {
  IsBoolean,
  IsInt,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class InternshipSkillItemDto {
  @IsString()
  @MinLength(1)
  skillId!: string;

  @IsBoolean()
  isRequired!: boolean;

  @IsInt()
  @Min(1)
  @Max(10)
  weight!: number;
}
