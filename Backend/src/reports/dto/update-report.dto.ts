import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateReportDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(10000) content?: string;
  @IsOptional() @IsString() fileId?: string | null;
}
