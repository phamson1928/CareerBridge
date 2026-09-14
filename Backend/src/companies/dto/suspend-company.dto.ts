import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SuspendCompanyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(1000)
  reason!: string;
}
