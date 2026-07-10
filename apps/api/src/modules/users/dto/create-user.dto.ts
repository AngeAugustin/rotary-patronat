import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RoleCode } from '@rotary/shared-types';

class CommissionAssignmentDto {
  @IsUUID()
  commissionId!: string;

  @IsString()
  @MinLength(1)
  role!: string;
}

export class CreateUserDto {
  @IsUUID()
  memberId!: string;

  @IsArray()
  roles!: RoleCode[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommissionAssignmentDto)
  commissions!: CommissionAssignmentDto[];
}

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @IsOptional()
  @IsArray()
  roles?: RoleCode[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommissionAssignmentDto)
  commissions?: CommissionAssignmentDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
