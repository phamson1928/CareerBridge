import { Transform, TransformFnParams } from 'class-transformer';
import { IsEmail, MaxLength } from 'class-validator';

export class ForgotPasswordDto {
  @Transform((params: TransformFnParams): unknown =>
    typeof params.value === 'string'
      ? params.value.trim().toLowerCase()
      : params.value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;
}
