import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ArrayMinSize,
} from 'class-validator';
import { ConversationType } from '@rotary/shared-types';

export class CreateConversationDto {
  @IsEnum(['DIRECT', 'GROUP'])
  type!: ConversationType;

  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  participantIds!: string[];
}

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsArray()
  attachments?: { type: string; url: string; name?: string }[];
}
