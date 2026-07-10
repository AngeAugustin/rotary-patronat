import { IsOptional, IsString, IsUUID } from 'class-validator';

export class AssignProjectMemberDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsString()
  role?: string;
}
