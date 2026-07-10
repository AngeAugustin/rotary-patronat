import { IsString, IsUUID, MinLength } from 'class-validator';

export class AssignMemberDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @MinLength(1)
  role!: string;
}
