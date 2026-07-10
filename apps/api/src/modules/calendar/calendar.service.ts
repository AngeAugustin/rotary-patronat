import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AttendanceStatus,
  CalendarEventFormat,
  CalendarEventType,
  CalendarEventVisibility,
  NotificationType,
  Prisma,
  ProjectStatus,
  PublishStatus,
} from '@prisma/client';
import {
  AuthUser,
  CalendarEventItem,
  CreateCalendarEventInput,
  RoleCode,
  UpdateAttendanceInput,
  UpdateCalendarEventInput,
} from '@rotary/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { LogsService } from '../logs/logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeService } from '../realtime/realtime.service';

type CalendarEventWithRelations = Prisma.CalendarEventGetPayload<{
  include: {
    commission: true;
    project: true;
    createdBy: true;
    attendees: { include: { user: true } };
  };
}>;

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logsService: LogsService,
    private readonly notificationsService: NotificationsService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async findInRange(
    user: AuthUser,
    query: { from: string; to: string },
  ): Promise<{ data: CalendarEventItem[] }> {
    const from = new Date(query.from);
    const to = new Date(query.to);

    const eventWhere: Prisma.CalendarEventWhereInput = {
      startAt: { lte: to },
      endAt: { gte: from },
    };

    const [events, meetings, projects] = await Promise.all([
      this.prisma.calendarEvent.findMany({
        where: eventWhere,
        include: {
          commission: true,
          project: true,
          createdBy: true,
          attendees: { include: { user: true } },
        },
        orderBy: { startAt: 'asc' },
      }),
      this.prisma.meeting.findMany({
        where: {
          status: PublishStatus.PUBLISHED,
          calendarEventId: null,
          date: { gte: from, lte: to },
        },
        orderBy: { date: 'asc' },
      }),
      this.prisma.project.findMany({
        where: {
          status: {
            in: [ProjectStatus.PLANNED, ProjectStatus.IN_PROGRESS],
          },
          startDate: { lte: to },
          OR: [{ endDate: null }, { endDate: { gte: from } }],
        },
        include: {
          commission: { select: { id: true, name: true } },
          leadUser: { select: { firstName: true, lastName: true } },
        },
        orderBy: { startDate: 'asc' },
      }),
    ]);

    const calendarItems = events.map((event) => this.toItem(event, user.id));
    const meetingItems: CalendarEventItem[] = meetings.map((meeting) => {
      const startAt = new Date(meeting.date);
      const [hours, minutes] = meeting.startTime.split(':').map(Number);
      startAt.setHours(hours ?? 0, minutes ?? 0, 0, 0);
      const endAt = new Date(startAt.getTime() + 2 * 60 * 60 * 1000);

      return {
        id: `meeting-${meeting.id}`,
        title: meeting.title,
        description: meeting.description,
        type: 'MEETING',
        format: 'IN_PERSON',
        visibility: 'PUBLIC',
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        location: meeting.location,
        meetingUrl: null,
        commissionId: null,
        commissionName: null,
        projectId: null,
        projectTitle: null,
        createdByName: 'Club',
        attendees: [],
        myAttendance: null,
        source: 'meeting',
        projectStatus: null,
      };
    });

    const projectItems: CalendarEventItem[] = projects.map((project) => {
      const startAt = new Date(project.startDate);
      startAt.setHours(0, 0, 0, 0);
      const endAt = project.endDate ? new Date(project.endDate) : new Date(to);
      endAt.setHours(23, 59, 59, 999);

      return {
        id: `project-${project.id}`,
        title: project.title,
        description: project.description,
        type: 'PROJECT',
        format: 'IN_PERSON',
        visibility: 'PRIVATE',
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        location: null,
        meetingUrl: null,
        commissionId: project.commissionId,
        commissionName: project.commission.name,
        projectId: project.id,
        projectTitle: project.title,
        createdByName: `${project.leadUser.firstName} ${project.leadUser.lastName}`,
        attendees: [],
        myAttendance: null,
        source: 'project',
        projectStatus: project.status,
      };
    });

    return {
      data: [...calendarItems, ...meetingItems, ...projectItems].sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      ),
    };
  }

  async create(user: AuthUser, input: CreateCalendarEventInput, ipAddress?: string) {
    if (!this.canManageEvents(user)) {
      throw new ForbiddenException('Droits insuffisants pour créer un événement');
    }

    const activeMembers = await this.prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    const attendeeIds = [
      ...new Set([
        ...activeMembers.map((member) => member.id),
        ...(input.attendeeIds ?? []),
      ]),
    ];

    const format = (input.format as CalendarEventFormat) ?? CalendarEventFormat.IN_PERSON;
    const visibility =
      (input.visibility as CalendarEventVisibility) ?? CalendarEventVisibility.PRIVATE;
    const location =
      format === CalendarEventFormat.IN_PERSON ? input.location?.trim() || null : null;
    const meetingUrl =
      format === CalendarEventFormat.ONLINE ? input.meetingUrl?.trim() || null : null;

    const event = await this.prisma.calendarEvent.create({
      data: {
        title: input.title,
        description: input.description,
        type: (input.type as CalendarEventType) ?? CalendarEventType.EVENT,
        format,
        visibility,
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt),
        location,
        meetingUrl,
        commissionId: input.commissionId,
        projectId: input.projectId,
        createdById: user.id,
        attendees: {
          create: attendeeIds.map((userId) => ({
            userId,
            status:
              userId === user.id
                ? AttendanceStatus.ACCEPTED
                : AttendanceStatus.INVITED,
          })),
        },
      },
      include: {
        commission: true,
        project: true,
        createdBy: true,
        attendees: { include: { user: true } },
      },
    });

    if (visibility === CalendarEventVisibility.PUBLIC) {
      await this.syncPublicMeeting(event);
    }

    for (const attendeeId of attendeeIds.filter((id) => id !== user.id)) {
      const notification = await this.notificationsService.create({
        userId: attendeeId,
        type: NotificationType.CALENDAR_INVITE,
        title: `Invitation : ${event.title}`,
        body: location ?? meetingUrl ?? undefined,
        resource: 'calendar',
        resourceId: event.id,
      });
      this.realtimeService.notifyUser(attendeeId, notification);
    }

    await this.logsService.logActivity({
      userId: user.id,
      action: 'CALENDAR_EVENT_CREATE',
      resource: 'calendar',
      resourceId: event.id,
      ipAddress,
    });

    return this.toItem(event, user.id);
  }

  async update(
    user: AuthUser,
    id: string,
    input: UpdateCalendarEventInput,
    ipAddress?: string,
  ) {
    if (!this.canManageEvents(user)) {
      throw new ForbiddenException('Droits insuffisants pour modifier un événement');
    }

    const existing = await this.prisma.calendarEvent.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Événement introuvable');

    const format = (input.format as CalendarEventFormat) ?? existing.format;
    const visibility =
      (input.visibility as CalendarEventVisibility) ?? existing.visibility;
    const location =
      format === CalendarEventFormat.IN_PERSON ? input.location?.trim() || null : null;
    const meetingUrl =
      format === CalendarEventFormat.ONLINE ? input.meetingUrl?.trim() || null : null;

    const event = await this.prisma.calendarEvent.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        type: (input.type as CalendarEventType) ?? existing.type,
        format,
        visibility,
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt),
        location,
        meetingUrl,
        commissionId: input.commissionId ?? null,
        projectId: input.projectId ?? null,
      },
      include: {
        commission: true,
        project: true,
        createdBy: true,
        attendees: { include: { user: true } },
      },
    });

    if (visibility === CalendarEventVisibility.PUBLIC) {
      await this.syncPublicMeeting(event);
    } else {
      await this.removePublicMeeting(event.id);
    }

    await this.logsService.logActivity({
      userId: user.id,
      action: 'CALENDAR_EVENT_UPDATE',
      resource: 'calendar',
      resourceId: event.id,
      ipAddress,
    });

    return this.toItem(event, user.id);
  }

  async remove(user: AuthUser, id: string, ipAddress?: string) {
    if (!this.canManageEvents(user)) {
      throw new ForbiddenException('Droits insuffisants pour supprimer un événement');
    }

    const existing = await this.prisma.calendarEvent.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Événement introuvable');

    await this.prisma.calendarEvent.delete({ where: { id } });

    await this.logsService.logActivity({
      userId: user.id,
      action: 'CALENDAR_EVENT_DELETE',
      resource: 'calendar',
      resourceId: id,
      metadata: { title: existing.title },
      ipAddress,
    });

    return { success: true };
  }

  async updateAttendance(
    user: AuthUser,
    eventId: string,
    input: UpdateAttendanceInput,
    ipAddress?: string,
  ) {
    const eventExists = await this.prisma.calendarEvent.findUnique({
      where: { id: eventId },
      select: { id: true },
    });
    if (!eventExists) {
      throw new NotFoundException('Événement introuvable');
    }

    await this.prisma.calendarEventAttendee.upsert({
      where: { eventId_userId: { eventId, userId: user.id } },
      create: {
        eventId,
        userId: user.id,
        status: input.status as AttendanceStatus,
      },
      update: { status: input.status as AttendanceStatus },
    });

    await this.logsService.logActivity({
      userId: user.id,
      action: 'CALENDAR_ATTENDANCE_UPDATE',
      resource: 'calendar',
      resourceId: eventId,
      ipAddress,
    });

    const event = await this.prisma.calendarEvent.findUniqueOrThrow({
      where: { id: eventId },
      include: {
        commission: true,
        project: true,
        createdBy: true,
        attendees: { include: { user: true } },
      },
    });

    return this.toItem(event, user.id);
  }

  async findById(user: AuthUser, id: string) {
    if (id.startsWith('meeting-')) {
      const meetingId = id.slice('meeting-'.length);
      const meeting = await this.prisma.meeting.findFirst({
        where: { id: meetingId, status: PublishStatus.PUBLISHED },
      });
      if (!meeting) throw new NotFoundException('Événement introuvable');

      const startAt = new Date(meeting.date);
      const [hours, minutes] = meeting.startTime.split(':').map(Number);
      startAt.setHours(hours ?? 0, minutes ?? 0, 0, 0);
      const endAt = new Date(startAt.getTime() + 2 * 60 * 60 * 1000);

      return {
        id: `meeting-${meeting.id}`,
        title: meeting.title,
        description: meeting.description,
        type: 'MEETING' as const,
        format: 'IN_PERSON' as const,
        visibility: 'PUBLIC' as const,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        location: meeting.location,
        meetingUrl: null,
        commissionId: null,
        commissionName: null,
        projectId: null,
        projectTitle: null,
        createdByName: 'Club',
        attendees: [],
        myAttendance: null,
        source: 'meeting' as const,
        projectStatus: null,
      };
    }

    if (id.startsWith('project-')) {
      const projectId = id.slice('project-'.length);
      const project = await this.prisma.project.findFirst({
        where: {
          id: projectId,
          status: {
            in: [ProjectStatus.PLANNED, ProjectStatus.IN_PROGRESS],
          },
        },
        include: {
          commission: { select: { id: true, name: true } },
          leadUser: { select: { firstName: true, lastName: true } },
        },
      });
      if (!project) throw new NotFoundException('Projet introuvable');

      const startAt = new Date(project.startDate);
      startAt.setHours(0, 0, 0, 0);
      const endAt = project.endDate
        ? new Date(project.endDate)
        : new Date(startAt);
      endAt.setHours(23, 59, 59, 999);

      return {
        id: `project-${project.id}`,
        title: project.title,
        description: project.description,
        type: 'PROJECT' as const,
        format: 'IN_PERSON' as const,
        visibility: 'PRIVATE' as const,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        location: null,
        meetingUrl: null,
        commissionId: project.commissionId,
        commissionName: project.commission.name,
        projectId: project.id,
        projectTitle: project.title,
        createdByName: `${project.leadUser.firstName} ${project.leadUser.lastName}`,
        attendees: [],
        myAttendance: null,
        source: 'project' as const,
        projectStatus: project.status,
      };
    }

    const event = await this.prisma.calendarEvent.findUnique({
      where: { id },
      include: {
        commission: true,
        project: true,
        createdBy: true,
        attendees: { include: { user: true } },
      },
    });
    if (!event) throw new NotFoundException('Événement introuvable');
    return this.toItem(event, user.id);
  }

  private canManageEvents(user: AuthUser) {
    return (
      user.roles.includes(RoleCode.ADMIN) ||
      user.roles.includes(RoleCode.COMMISSION_LEAD) ||
      user.roles.includes(RoleCode.SECRETARY) ||
      user.roles.includes(RoleCode.PRESIDENT)
    );
  }

  private async syncPublicMeeting(
    event: Pick<
      CalendarEventWithRelations,
      | 'id'
      | 'title'
      | 'description'
      | 'startAt'
      | 'endAt'
      | 'location'
      | 'meetingUrl'
      | 'format'
    >,
  ) {
    const publicLocation = this.toPublicLocation(event);
    const startTime = this.formatTime(event.startAt);
    const date = this.toMeetingDate(event.startAt);
    const existing = await this.prisma.meeting.findUnique({
      where: { calendarEventId: event.id },
    });

    if (existing) {
      await this.prisma.meeting.update({
        where: { id: existing.id },
        data: {
          title: event.title,
          description: event.description,
          date,
          startTime,
          location: publicLocation,
          agenda: event.description,
          status: PublishStatus.PUBLISHED,
          publishedAt: existing.publishedAt ?? new Date(),
        },
      });
      return;
    }

    const slug = await this.uniqueMeetingSlug(event.title, event.startAt);
    await this.prisma.meeting.create({
      data: {
        title: event.title,
        slug,
        description: event.description,
        date,
        startTime,
        location: publicLocation,
        agenda: event.description,
        status: PublishStatus.PUBLISHED,
        publishedAt: new Date(),
        calendarEventId: event.id,
      },
    });
  }

  private async removePublicMeeting(calendarEventId: string) {
    await this.prisma.meeting.deleteMany({
      where: { calendarEventId },
    });
  }

  private toPublicLocation(
    event: Pick<
      CalendarEventWithRelations,
      'format' | 'location' | 'meetingUrl'
    >,
  ) {
    if (event.format === CalendarEventFormat.ONLINE) {
      return event.meetingUrl?.trim() || 'En ligne';
    }
    return event.location?.trim() || 'Lieu à confirmer';
  }

  private toMeetingDate(startAt: Date) {
    return new Date(
      Date.UTC(startAt.getFullYear(), startAt.getMonth(), startAt.getDate()),
    );
  }

  private formatTime(date: Date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private slugify(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }

  private async uniqueMeetingSlug(title: string, startAt: Date) {
    const datePart = [
      startAt.getFullYear(),
      String(startAt.getMonth() + 1).padStart(2, '0'),
      String(startAt.getDate()).padStart(2, '0'),
    ].join('-');
    const base = this.slugify(title) || 'reunion';
    let slug = `${base}-${datePart}`;
    let suffix = 2;

    while (await this.prisma.meeting.findUnique({ where: { slug } })) {
      slug = `${base}-${datePart}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }

  private toItem(event: CalendarEventWithRelations, currentUserId: string): CalendarEventItem {
    const myAttendance =
      event.attendees.find((a) => a.userId === currentUserId)?.status ??
      AttendanceStatus.INVITED;

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      type: event.type,
      format: event.format,
      visibility: event.visibility,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt.toISOString(),
      location: event.location,
      meetingUrl: event.meetingUrl,
      commissionId: event.commissionId,
      commissionName: event.commission?.name ?? null,
      projectId: event.projectId,
      projectTitle: event.project?.title ?? null,
      createdByName: `${event.createdBy.firstName} ${event.createdBy.lastName}`,
      attendees: event.attendees.map((a) => ({
        userId: a.userId,
        firstName: a.user.firstName,
        lastName: a.user.lastName,
        status: a.status,
      })),
      myAttendance,
      source: 'calendar',
      projectStatus: null,
    };
  }
}
