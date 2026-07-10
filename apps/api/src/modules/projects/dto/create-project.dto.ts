import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { ProjectStatus } from '@rotary/shared-types';

export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  slug!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsOptional()
  @IsString()
  objectives?: string;

  @IsUUID()
  commissionId!: string;

  @IsUUID()
  leadUserId!: string;

  @IsOptional()
  @IsEnum(['PLANNED', 'IN_PROGRESS', 'SUSPENDED', 'COMPLETED'])
  status?: ProjectStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progressPercent?: number;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsNumber()
  @Min(0)
  budgetPlanned!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetSpent?: number;

  @IsOptional()
  @IsArray()
  partners?: string[];

  @IsOptional()
  @IsArray()
  beneficiaries?: string[];
}
