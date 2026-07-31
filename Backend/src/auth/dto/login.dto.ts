import { Transform, TransformFnParams } from 'class-transformer';
import { IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @Transform((params: TransformFnParams): unknown =>
    normalizeEmailValue(params.value as unknown),
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MaxLength(72)
  password!: string;
}

function normalizeEmailValue(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}
