import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateCompanyProfileDto {
  @IsOptional()
  @Transform((params: TransformFnParams): unknown =>
    typeof params.value === 'string' ? params.value.trim() : params.value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  companyName?: string;

  @IsOptional()
  @Transform((params: TransformFnParams): unknown =>
    typeof params.value === 'string'
      ? params.value.replace(/\s+/g, '').toUpperCase() || null
      : params.value,
  )
  @IsString()
  @Matches(/^[A-Z0-9-]{8,30}$/, {
    message:
      'businessRegistrationNumber must contain 8-30 letters, numbers, or hyphens',
  })
  businessRegistrationNumber?: string | null;

  @IsOptional()
  @Transform((params: TransformFnParams): unknown =>
    typeof params.value === 'string'
      ? params.value.trim() || null
      : params.value,
  )
  @IsString()
  @MaxLength(200)
  contactPersonName?: string | null;

  @IsOptional()
  @Transform((params: TransformFnParams): unknown =>
    typeof params.value === 'string'
      ? params.value.trim() || null
      : params.value,
  )
  @IsString()
  @Matches(/^[0-9+().\s-]{8,30}$/, {
    message: 'contactPhone must be a valid phone number',
  })
  contactPhone?: string | null;

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

  @IsOptional()
  @Transform((params: TransformFnParams): unknown =>
    typeof params.value === 'string'
      ? params.value.trim() || null
      : params.value,
  )
  @IsString()
  @MaxLength(30)
  registrationDocumentFileId?: string | null;
}
