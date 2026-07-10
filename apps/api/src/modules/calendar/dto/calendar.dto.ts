import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  AttendanceStatus,
  CalendarEventFormat,
  CalendarEventVisibility,
} from '@rotary/shared-types';

export class CreateCalendarEventDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['MEETING', 'EVENT'])
  type?: 'MEETING' | 'EVENT';

  @IsEnum(['IN_PERSON', 'ONLINE'])
  format!: CalendarEventFormat;

  @IsEnum(['PRIVATE', 'PUBLIC'])
  visibility!: CalendarEventVisibility;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @ValidateIf((o: CreateCalendarEventDto) => o.format === 'IN_PERSON')
  @IsString()
  @MinLength(1)
  location?: string;

  @ValidateIf((o: CreateCalendarEventDto) => o.format === 'ONLINE')
  @IsUrl()
  meetingUrl?: string;

  @IsOptional()
  @IsUUID()
  commissionId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  attendeeIds?: string[];
}

export class UpdateCalendarEventDto extends CreateCalendarEventDto {}

export class UpdateAttendanceDto {
  @IsEnum(['ACCEPTED', 'DECLINED', 'MAYBE'])
  status!: Exclude<AttendanceStatus, 'INVITED'>;
}
