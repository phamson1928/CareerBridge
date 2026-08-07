import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class UpdateCompanyProfileDto {
  @IsOptional()
  @Transform((params: TransformFnParams): unknown =>
    typeof params.value === 'string' ? params.value.trim() : params.value,
  )
  @IsString()
  @MaxLength(200)
  companyName?: string;

  @IsOptional()
  @Transform((params: TransformFnParams): unknown =>
    typeof params.value === 'string'
      ? params.value.trim() || null
      : params.value,
  )
  @IsString()
  @MaxLength(200)
  tagline?: string | null;

  @IsOptional()
  @Transform((params: TransformFnParams): unknown =>
    typeof params.value === 'string'
      ? params.value.trim() || null
      : params.value,
  )
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @Transform((params: TransformFnParams): unknown =>
    typeof params.value === 'string'
      ? params.value.trim() || null
      : params.value,
  )
  @IsString()
  @MaxLength(150)
  industry?: string | null;

  @IsOptional()
  @Transform((params: TransformFnParams): unknown =>
    typeof params.value === 'string'
      ? params.value.trim() || null
      : params.value,
  )
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  website?: string | null;

  @IsOptional()
  @Transform((params: TransformFnParams): unknown =>
    typeof params.value === 'string'
      ? params.value.trim() || null
      : params.value,
  )
  @IsString()
  @MaxLength(500)
  address?: string | null;

  @IsOptional()
  @Transform((params: TransformFnParams): unknown =>
    typeof params.value === 'string'
      ? params.value.trim() || null
      : params.value,
  )
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  logo?: string | null;

  @IsOptional()
  @Transform((params: TransformFnParams): unknown =>
    typeof params.value === 'string'
      ? params.value.trim().toLowerCase() || null
      : params.value,
  )
  @IsEmail()
  @MaxLength(254)
  contactEmail?: string | null;
}
