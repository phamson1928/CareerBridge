import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../generated/prisma/client';

export class RegisterDto {
  @Transform((params: TransformFnParams): unknown =>
    normalizeEmailValue(params.value as unknown),
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/[A-Za-z]/, { message: 'password must contain at least one letter' })
  @Matches(/[0-9]/, { message: 'password must contain at least one number' })
  password!: string;

  @IsIn([Role.STUDENT, Role.COMPANY], {
    message: 'role must be either STUDENT or COMPANY',
  })
  role!: Role;
}

function normalizeEmailValue(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}
