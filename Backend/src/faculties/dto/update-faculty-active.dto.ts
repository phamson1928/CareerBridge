import { IsBoolean } from 'class-validator';

export class UpdateFacultyActiveDto {
  @IsBoolean()
  isActive!: boolean;
}
