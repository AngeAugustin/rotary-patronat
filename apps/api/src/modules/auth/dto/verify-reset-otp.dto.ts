import { IsEmail, IsString, Matches } from 'class-validator';

export class VerifyResetOtpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'Le code doit contenir exactement 6 chiffres' })
  code!: string;
}
