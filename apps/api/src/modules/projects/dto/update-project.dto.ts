import { IsArray, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Matches, Max, Min, MinLength } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  slug?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;

  @IsOptional()
  @IsString()
  objectives?: string;

  @IsOptional()
  @IsUUID()
  commissionId?: string;

  @IsOptional()
  @IsUUID()
  leadUserId?: string;

  @IsOptional()
  @IsEnum(['PLANNED', 'IN_PROGRESS', 'SUSPENDED', 'COMPLETED'])
  status?: 'PLANNED' | 'IN_PROGRESS' | 'SUSPENDED' | 'COMPLETED';

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progressPercent?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetPlanned?: number;

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
