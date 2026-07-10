import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { DocumentFileType, DocumentVisibility } from '@rotary/shared-types';

export class CreateDocumentDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUrl()
  fileUrl!: string;

  @IsOptional()
  @IsEnum(['PDF', 'IMAGE', 'VIDEO', 'OTHER'])
  fileType?: DocumentFileType;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  fileSize?: number;

  @IsOptional()
  @IsEnum(['PUBLIC', 'PRIVATE'])
  visibility?: DocumentVisibility;

  @IsUUID()
  categoryId!: string;

  @IsOptional()
  @IsUUID()
  commissionId?: string;
}
