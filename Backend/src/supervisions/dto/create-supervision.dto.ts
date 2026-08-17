import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSupervisionDto {
  @IsString()
  @IsNotEmpty()
  placementId!: string;

  @IsString()
  @IsNotEmpty()
  lecturerId!: string;
}
