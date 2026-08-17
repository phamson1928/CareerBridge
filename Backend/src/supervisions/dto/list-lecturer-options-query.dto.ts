import { IsOptional, IsString } from 'class-validator';

export class ListLecturerOptionsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}
