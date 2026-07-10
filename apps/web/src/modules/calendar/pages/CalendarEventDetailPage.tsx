import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Link2,
  MapPin,
  Pencil,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';
import {
  ATTENDANCE_STATUS_LABELS,
  CALENDAR_EVENT_FORMAT_LABELS,
  CALENDAR_EVENT_TYPE_LABELS,
  CALENDAR_EVENT_VISIBILITY_LABELS,
  CalendarEventFormat,
  CalendarEventType,
  CalendarEventVisibility,
  RoleCode,
  type CalendarEventType as CalendarEventTypeValue,
} from '@rotary/shared-types';
import {
  deleteCalendarEvent,
  fetchCalendarEvent,
  updateEventAttendance,
} from '../api';
import { CreateMeetingSlideOver } from '../components/CreateMeetingSlideOver';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DashboardSkeleton } from '@/modules/dashboard/components/layout';
import { UserAvatar } from '@/modules/dashboard/components/UserAvatar';
import { useCurrentUser } from '@/modules/auth/hooks/use-auth';
import { cn } from '@/lib/utils';

const CALENDAR_MANAGE_ROLES = new Set<string>([
  RoleCode.ADMIN,
  RoleCode.PRESIDENT,
  RoleCode.SECRETARY,
  RoleCode.COMMISSION_LEAD,
]);

const EVENT_TYPE_CHIP: Record<CalendarEventTypeValue, string> = {
  [CalendarEventType.MEETING]: 'bg-primary-50 text-primary-800',
  [CalendarEventType.EVENT]: 'bg-accent-50 text-accent-800',
  [CalendarEventType.COMMISSION]: 'bg-sky-50 text-sky-800',
  [CalendarEventType.PROJECT]: 'bg-emerald-50 text-emerald-800',
  [CalendarEventType.OTHER]: 'bg-neutral-100 text-neutral-700',
};

function formatFullDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function InfoChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-neutral-100/80 bg-neutral-0/60 px-3 py-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-primary-900">{value}</p>
      </div>
    </div>
  );
}

export function CalendarEventDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const canManage = Boolean(
    currentUser?.roles.some((role) => CALENDAR_MANAGE_ROLES.has(role)),
  );

  const { data: event, isLoading } = useQuery({
    queryKey: queryKeys.calendar.detail(id),
    queryFn: () => fetchCalendarEvent(id),
    enabled: Boolean(id),
  });

  const attendanceMutation = useMutation({
    mutationFn: (status: 'ACCEPTED' | 'DECLINED' | 'MAYBE') =>
      updateEventAttendance(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['calendar', 'range'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCalendarEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', 'range'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview });
      queryClient.removeQueries({ queryKey: queryKeys.calendar.detail(id) });
      navigate('/dashboard/calendrier');
    },
  });

  const closeDeleteDialog = () => {
    if (deleteMutation.isPending) return;
    setShowDelete(false);
    deleteMutation.reset();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <DashboardSkeleton className="h-5 w-36" />
        <DashboardSkeleton className="h-44 w-full rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-5">
          <DashboardSkeleton className="h-64 w-full rounded-2xl lg:col-span-3" />
          <DashboardSkeleton className="h-64 w-full rounded-2xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-neutral-700">Réunion introuvable.</p>
        <Button asChild variant="outline">
          <Link to="/dashboard/calendrier">Retour au calendrier</Link>
        </Button>
      </div>
    );
  }

  const canEdit = canManage && event.source === 'calendar';
  const canRespond = event.source === 'calendar';

  return (
    <div className="space-y-4">
      <Link
        to="/dashboard/calendrier"
        className="group inline-flex items-center gap-2 text-sm font-medium text-neutral-400 transition-colors hover:text-primary-700"
      >
        <ArrowLeft
          className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
          aria-hidden
        />
        Retour au calendrier
      </Link>

      <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-0 shadow-soft">
        <div className="bg-gradient-to-br from-primary-50/90 via-neutral-0 to-accent-50/30 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 ring-2 ring-primary-100">
                <CalendarDays className="h-6 w-6" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-700">
                  {CALENDAR_EVENT_TYPE_LABELS[event.type]}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-semibold tracking-tight text-primary-900 sm:text-2xl">
                    {event.title}
                  </h2>
                  <Badge className={cn(EVENT_TYPE_CHIP[event.type])}>
                    {CALENDAR_EVENT_FORMAT_LABELS[event.format]}
                  </Badge>
                  <Badge
                    className={
                      event.visibility === CalendarEventVisibility.PUBLIC
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'bg-neutral-100 text-neutral-700'
                    }
                  >
                    {CALENDAR_EVENT_VISIBILITY_LABELS[event.visibility]}
                  </Badge>
                </div>
                <p className="mt-1.5 text-sm capitalize text-neutral-600">
                  {formatFullDate(event.startAt)}
                </p>
              </div>
            </div>

            {canEdit && (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-neutral-0/80"
                  onClick={() => setShowEdit(true)}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                  Modifier
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-neutral-0/80 text-red-700 hover:border-red-200 hover:bg-red-50 hover:text-red-800"
                  onClick={() => {
                    deleteMutation.reset();
                    setShowDelete(true);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Supprimer
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <InfoChip
              icon={Clock}
              label="Horaires"
              value={`${formatTime(event.startAt)} – ${formatTime(event.endAt)}`}
            />
            <InfoChip
              icon={event.format === CalendarEventFormat.ONLINE ? Link2 : MapPin}
              label={event.format === CalendarEventFormat.ONLINE ? 'Lien' : 'Lieu'}
              value={
                event.format === CalendarEventFormat.ONLINE
                  ? event.meetingUrl ?? '—'
                  : event.location ?? '—'
              }
            />
            <InfoChip icon={UserRound} label="Organisé par" value={event.createdByName} />
            <InfoChip
              icon={Users}
              label="Participants"
              value={`${event.attendees.length}`}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-3">
          {event.description && (
            <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
              <h3 className="font-display text-sm font-semibold text-primary-900">
                Description
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                {event.description}
              </p>
            </section>
          )}

          {(event.commissionName || event.projectTitle) && (
            <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
              <h3 className="font-display text-sm font-semibold text-primary-900">
                Rattachement
              </h3>
              <div className="mt-3 space-y-2 text-sm text-neutral-700">
                {event.commissionName && (
                  <p>
                    <span className="text-neutral-400">Commission · </span>
                    {event.commissionName}
                  </p>
                )}
                {event.projectTitle && (
                  <p>
                    <span className="text-neutral-400">Projet · </span>
                    {event.projectTitle}
                  </p>
                )}
              </div>
            </section>
          )}

          {event.format === CalendarEventFormat.ONLINE && event.meetingUrl && (
            <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
              <h3 className="font-display text-sm font-semibold text-primary-900">
                Rejoindre en ligne
              </h3>
              <a
                href={event.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex text-sm font-medium text-primary-700 underline-offset-2 hover:underline"
              >
                {event.meetingUrl}
              </a>
            </section>
          )}
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          {canRespond && (
            <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
              <h3 className="font-display text-sm font-semibold text-primary-900">
                Votre participation
              </h3>
              <p className="mt-1 text-xs text-neutral-500">
                Statut actuel :{' '}
                {event.myAttendance
                  ? ATTENDANCE_STATUS_LABELS[event.myAttendance]
                  : '—'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(['ACCEPTED', 'MAYBE', 'DECLINED'] as const).map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={event.myAttendance === status ? 'default' : 'outline'}
                    disabled={attendanceMutation.isPending}
                    onClick={() => attendanceMutation.mutate(status)}
                  >
                    {status === 'ACCEPTED'
                      ? 'Confirmer'
                      : status === 'MAYBE'
                        ? 'Peut-être'
                        : 'Décliner'}
                  </Button>
                ))}
              </div>
              {attendanceMutation.isError && (
                <p className="mt-3 text-sm text-red-600">
                  {attendanceMutation.error.message}
                </p>
              )}
            </section>
          )}

          <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
            <h3 className="font-display text-sm font-semibold text-primary-900">
              Participants
              {event.attendees.length > 0 && (
                <span className="ml-1.5 font-normal text-neutral-400">
                  ({event.attendees.length})
                </span>
              )}
            </h3>
            {event.attendees.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500">
                Aucun participant enregistré.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {event.attendees.map((attendee) => (
                  <li
                    key={attendee.userId}
                    className="flex items-center gap-3 rounded-xl border border-neutral-100 px-3 py-2.5"
                  >
                    <UserAvatar
                      firstName={attendee.firstName}
                      lastName={attendee.lastName}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-primary-900">
                        {attendee.firstName} {attendee.lastName}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {ATTENDANCE_STATUS_LABELS[attendee.status]}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {event.source === 'meeting' && (
            <p className="px-1 text-xs text-neutral-400">
              Réunion publique — visible sur le site institutionnel.
            </p>
          )}
        </div>
      </div>

      {canEdit && (
        <CreateMeetingSlideOver
          open={showEdit}
          onClose={() => setShowEdit(false)}
          event={event}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.calendar.detail(id) });
          }}
        />
      )}

      <ConfirmDialog
        open={showDelete}
        onClose={closeDeleteDialog}
        onConfirm={() => deleteMutation.mutate()}
        title="Supprimer cette réunion ?"
        description={`La réunion « ${event.title} » sera définitivement supprimée.`}
        confirmLabel="Supprimer"
        confirmPending={deleteMutation.isPending}
        error={deleteMutation.isError ? deleteMutation.error.message : null}
        destructive
      />
    </div>
  );
}
