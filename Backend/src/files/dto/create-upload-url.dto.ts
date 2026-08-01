import { IsEnum, IsInt, IsString, Max, MaxLength, Min } from 'class-validator';
import { FileType } from '../../generated/prisma/client';

export class CreateUploadUrlDto {
  @IsEnum(FileType)
  type!: FileType;

  @IsString()
  @MaxLength(255)
  originalName!: string;

  @IsString()
  @MaxLength(255)
  mimeType!: string;

  @IsInt()
  @Min(1)
  @Max(10 * 1024 * 1024)
  sizeBytes!: number;
}
