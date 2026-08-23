import { IsString, MaxLength } from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  internshipId!: string;

  @IsString()
  @MaxLength(10_000)
  coverLetter!: string;

  @IsString()
  cvFileId!: string;
}
