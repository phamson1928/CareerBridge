import { IsBoolean } from 'class-validator';

export class UpdateMajorActiveDto {
  @IsBoolean()
  isActive!: boolean;
}
