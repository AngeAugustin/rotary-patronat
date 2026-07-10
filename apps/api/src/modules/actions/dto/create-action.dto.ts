import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ActionVideoDto {
  @IsUrl()
  url!: string;

  @IsString()
  @MinLength(1)
  title!: string;
}

export class CreateActionDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  slug!: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsDateString()
  date!: string;

  @IsString()
  @MinLength(1)
  location!: string;

  @IsOptional()
  @IsUrl()
  coverImage?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  gallery?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActionVideoDto)
  videos?: ActionVideoDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  partners?: string[];

  @IsOptional()
  @IsString()
  results?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}
