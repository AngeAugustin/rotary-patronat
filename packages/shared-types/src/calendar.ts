import { z } from 'zod';

export const CalendarEventType = {
  MEETING: 'MEETING',
  EVENT: 'EVENT',
  COMMISSION: 'COMMISSION',
  PROJECT: 'PROJECT',
  OTHER: 'OTHER',
} as const;

export type CalendarEventType =
  (typeof CalendarEventType)[keyof typeof CalendarEventType];

export const CALENDAR_EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  [CalendarEventType.MEETING]: 'Réunion',
  [CalendarEventType.EVENT]: 'Événement',
  [CalendarEventType.COMMISSION]: 'Commission',
  [CalendarEventType.PROJECT]: 'Projet',
  [CalendarEventType.OTHER]: 'Autre',
};

export const CalendarEventFormat = {
  IN_PERSON: 'IN_PERSON',
  ONLINE: 'ONLINE',
} as const;

export type CalendarEventFormat =
  (typeof CalendarEventFormat)[keyof typeof CalendarEventFormat];

export const CALENDAR_EVENT_FORMAT_LABELS: Record<CalendarEventFormat, string> = {
  [CalendarEventFormat.IN_PERSON]: 'Présentiel',
  [CalendarEventFormat.ONLINE]: 'En ligne',
};

export const CalendarEventVisibility = {
  PRIVATE: 'PRIVATE',
  PUBLIC: 'PUBLIC',
} as const;

export type CalendarEventVisibility =
  (typeof CalendarEventVisibility)[keyof typeof CalendarEventVisibility];

export const CALENDAR_EVENT_VISIBILITY_LABELS: Record<
  CalendarEventVisibility,
  string
> = {
  [CalendarEventVisibility.PRIVATE]: 'Privée',
  [CalendarEventVisibility.PUBLIC]: 'Publique',
};

export const AttendanceStatus = {
  INVITED: 'INVITED',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  MAYBE: 'MAYBE',
} as const;

export type AttendanceStatus =
  (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  [AttendanceStatus.INVITED]: 'Invité',
  [AttendanceStatus.ACCEPTED]: 'Confirmé',
  [AttendanceStatus.DECLINED]: 'Décliné',
  [AttendanceStatus.MAYBE]: 'Peut-être',
};

export const calendarAttendeeSchema = z.object({
  userId: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  status: z.enum(['INVITED', 'ACCEPTED', 'DECLINED', 'MAYBE']),
});

export type CalendarAttendee = z.infer<typeof calendarAttendeeSchema>;

export const calendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  type: z.enum(['MEETING', 'EVENT', 'COMMISSION', 'PROJECT', 'OTHER']),
  format: z.enum(['IN_PERSON', 'ONLINE']),
  visibility: z.enum(['PRIVATE', 'PUBLIC']),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  location: z.string().nullable(),
  meetingUrl: z.string().nullable(),
  commissionId: z.string().uuid().nullable(),
  commissionName: z.string().nullable(),
  projectId: z.string().uuid().nullable(),
  projectTitle: z.string().nullable(),
  createdByName: z.string(),
  attendees: z.array(calendarAttendeeSchema),
  myAttendance: z.enum(['INVITED', 'ACCEPTED', 'DECLINED', 'MAYBE']).nullable(),
  source: z.enum(['calendar', 'meeting', 'project']).optional(),
  projectStatus: z.enum(['PLANNED', 'IN_PROGRESS', 'SUSPENDED', 'COMPLETED']).nullable().optional(),
});

export type CalendarEventItem = z.infer<typeof calendarEventSchema>;

export const createCalendarEventSchema = z
  .object({
    title: z.string().min(1, 'Le titre est requis'),
    description: z.string().optional(),
    type: z.enum(['MEETING', 'EVENT']).optional(),
    format: z.enum(['IN_PERSON', 'ONLINE']),
    visibility: z.enum(['PRIVATE', 'PUBLIC']),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
    location: z.string().optional(),
    meetingUrl: z.string().optional(),
    commissionId: z.string().uuid().optional(),
    projectId: z.string().uuid().optional(),
    attendeeIds: z.array(z.string().uuid()).optional(),
  })
  .superRefine((values, ctx) => {
    if (values.format === 'IN_PERSON') {
      if (!values.location?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['location'],
          message: 'Le lieu est requis pour une réunion en présentiel',
        });
      }
    }
    if (values.format === 'ONLINE') {
      const url = values.meetingUrl?.trim() ?? '';
      if (!url) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['meetingUrl'],
          message: 'Le lien est requis pour une réunion en ligne',
        });
        return;
      }
      try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          throw new Error('invalid protocol');
        }
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['meetingUrl'],
          message: 'Lien invalide',
        });
      }
    }
  });

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>;

export const updateCalendarEventSchema = createCalendarEventSchema;

export type UpdateCalendarEventInput = z.infer<typeof updateCalendarEventSchema>;

export const updateAttendanceSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED', 'MAYBE']),
});

export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
