import { IsArray, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateMembershipApplicationDto {
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  phone!: string;

  @IsString()
  @MinLength(1)
  profession!: string;

  @IsString()
  @MinLength(20)
  motivation!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  sponsorFirstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  sponsorLastName?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];
}

export class ReviewMembershipApplicationDto {
  @IsString()
  status!: 'REVIEWED' | 'ACCEPTED' | 'REJECTED';

  @IsOptional()
  @IsString()
  adminNotes?: string;
}
