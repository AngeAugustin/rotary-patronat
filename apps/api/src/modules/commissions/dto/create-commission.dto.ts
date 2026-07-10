import { IsInt, IsOptional, IsString, IsUUID, MinLength, Matches } from 'class-validator';

export class CreateCommissionDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  slug!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsUUID()
  leadUserId?: string;
}
