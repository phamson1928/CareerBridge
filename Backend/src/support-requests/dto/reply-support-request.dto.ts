import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ReplySupportRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  adminReply!: string;
}
