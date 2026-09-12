import { Transform, TransformFnParams } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsString, MaxLength } from 'class-validator';

function trimItems({ value }: TransformFnParams): unknown {
  return Array.isArray(value)
    ? value.map((item) => (typeof item === 'string' ? item.trim() : item))
    : value;
}

export class UpdateStudentJobPreferencesDto {
  @Transform(trimItems)
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  desiredRoles!: string[];

  @Transform(trimItems)
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  preferredLocations!: string[];

  @Transform(trimItems)
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  preferredWorkTypes!: string[];
}
