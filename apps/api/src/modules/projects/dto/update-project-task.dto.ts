import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class UpdateProjectTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsEnum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'])
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
