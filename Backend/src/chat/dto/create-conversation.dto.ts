import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateConversationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(191)
  applicationId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(191)
  placementId?: string;
}
