import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
} from 'class-validator';

export class CreateVolunteeringDto {
  @IsString()
  @MinLength(1)
  visitedClub!: string;

  @IsString()
  @MinLength(1)
  city!: string;

  @IsString()
  @MinLength(1)
  country!: string;

  @IsString()
  @MinLength(1)
  activity!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsDateString()
  date!: string;

  @IsString()
  @MinLength(1)
  startTime!: string;

  @IsInt()
  @Min(15)
  durationMinutes!: number;

  @IsNumber()
  @Min(0.25)
  hours!: number;

  @IsOptional()
  @IsUrl()
  proofUrl?: string;
}

export class ReviewVolunteeringDto {
  @IsEnum(['VALIDATED', 'REJECTED'])
  status!: 'VALIDATED' | 'REJECTED';

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class UpdateVolunteeringDto extends CreateVolunteeringDto {}
