import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateSupervisionDto {
  @IsString()
  @IsNotEmpty()
  lecturerId!: string;
}
