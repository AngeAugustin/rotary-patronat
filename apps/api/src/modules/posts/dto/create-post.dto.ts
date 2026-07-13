import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PostKind, PostVisibility } from '@rotary/shared-types';

class PostAttachmentDto {
  @IsEnum(['image', 'video', 'document', 'link'])
  type!: 'image' | 'video' | 'document' | 'link';

  @IsUrl()
  url!: string;

  @IsOptional()
  @IsString()
  name?: string;
}

export class CreatePostDto {
  @IsOptional()
  @IsEnum(['MEMBER_POST', 'ANNOUNCEMENT', 'EVENT', 'COMMUNIQUE'])
  kind?: PostKind;

  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostAttachmentDto)
  attachments?: PostAttachmentDto[];

  @IsOptional()
  @IsString()
  linkUrl?: string;

  @IsOptional()
  @IsEnum(['ALL_MEMBERS', 'COMMISSION'])
  visibility?: PostVisibility;

  @IsOptional()
  @IsUUID()
  commissionId?: string;

  @IsOptional()
  @IsUUID()
  repostOfId?: string;
}

export class UpdatePostDto {
  @IsOptional()
  @IsEnum(['MEMBER_POST', 'ANNOUNCEMENT', 'EVENT', 'COMMUNIQUE'])
  kind?: PostKind;

  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostAttachmentDto)
  attachments?: PostAttachmentDto[];

  @IsOptional()
  @IsString()
  linkUrl?: string | null;

  @IsOptional()
  @IsEnum(['ALL_MEMBERS', 'COMMISSION'])
  visibility?: PostVisibility;

  @IsOptional()
  @IsUUID()
  commissionId?: string | null;
}

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class CreateContentReportDto {
  @IsEnum(['POST', 'COMMENT'])
  targetType!: 'POST' | 'COMMENT';

  @IsUUID()
  targetId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
