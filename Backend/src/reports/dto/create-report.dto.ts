import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateReportDto {
  @IsString() placementId!: string;
  @IsInt() @Min(1) @Max(52) week!: number;
  @IsString() @MaxLength(200) content!: string;
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() fileId?: string;
}
