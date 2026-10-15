import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SaveAsTemplateDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name!: string;
}
