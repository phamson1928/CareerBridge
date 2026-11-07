import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role, UserStatus } from '../../generated/prisma/client';
import { AdminPermission } from '../../common/constants/admin-permissions.constants';

export class UpdateUserDto {
  @IsOptional()
  @Transform((params: TransformFnParams): unknown =>
    typeof params.value === 'string'
      ? params.value.trim().toLowerCase()
      : params.value,
  )
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/[A-Za-z]/, { message: 'password must contain at least one letter' })
  @Matches(/[0-9]/, { message: 'password must contain at least one number' })
  password?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsBoolean()
  isSuperAdmin?: boolean;

  @IsOptional()
  @IsArray()
  @IsEnum(AdminPermission, { each: true })
  permissions?: AdminPermission[];
}
