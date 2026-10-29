import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReportDto {
  @IsString() placementId!: string;
  @IsInt() @Min(0) @Max(10) week!: number;
  @IsString() @MaxLength(10000) content!: string;
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() fileId?: string;
}
