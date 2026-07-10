import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  CALENDAR_EVENT_FORMAT_LABELS,
  CALENDAR_EVENT_TYPE_LABELS,
  CalendarEventFormat,
  CalendarEventType,
  PROJECT_STATUS_LABELS,
  RoleCode,
  type CalendarEventItem,
  type CalendarEventType as CalendarEventTypeValue,
  type ProjectStatus,
} from '@rotary/shared-types';
import { fetchCalendarEvents } from '../api';
import { CreateMeetingSlideOver } from '../components/CreateMeetingSlideOver';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/modules/auth/hooks/use-auth';
import {
  DashboardPageShell,
  DashboardPageHeader,
  DashboardSkeleton,
} from '@/modules/dashboard/components/layout';

const CALENDAR_CREATE_ROLES = new Set<string>([
  RoleCode.ADMIN,
  RoleCode.PRESIDENT,
  RoleCode.SECRETARY,
  RoleCode.COMMISSION_LEAD,
]);

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

type CalendarFilter = 'all' | 'meetings' | 'projects';

const FILTER_OPTIONS: { id: CalendarFilter; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'meetings', label: 'Réunions' },
  { id: 'projects', label: 'Projets' },
];

const EVENT_TYPE_STYLES: Record<
  CalendarEventTypeValue,
  { dot: string; chip: string; bar: string }
> = {
  [CalendarEventType.MEETING]: {
    dot: 'bg-primary-600',
    chip: 'bg-primary-50 text-primary-800',
    bar: 'bg-primary-600',
  },
  [CalendarEventType.EVENT]: {
    dot: 'bg-accent-500',
    chip: 'bg-accent-50 text-accent-800',
    bar: 'bg-accent-500',
  },
  [CalendarEventType.COMMISSION]: {
    dot: 'bg-sky-500',
    chip: 'bg-sky-50 text-sky-800',
    bar: 'bg-sky-500',
  },
  [CalendarEventType.PROJECT]: {
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-50 text-emerald-800',
    bar: 'bg-emerald-500',
  },
  [CalendarEventType.OTHER]: {
    dot: 'bg-neutral-400',
    chip: 'bg-neutral-100 text-neutral-700',
    bar: 'bg-neutral-400',
  },
};

/** Palette stable par projet (hash de l’id) — distincte des réunions / événements. */
const PROJECT_COLOR_PALETTE: { dot: string; chip: string; bar: string }[] = [
  {
    dot: 'bg-emerald-600',
    chip: 'bg-emerald-50 text-emerald-900',
    bar: 'border-emerald-600',
  },
  {
    dot: 'bg-teal-600',
    chip: 'bg-teal-50 text-teal-900',
    bar: 'border-teal-600',
  },
  {
    dot: 'bg-cyan-600',
    chip: 'bg-cyan-50 text-cyan-900',
    bar: 'border-cyan-600',
  },
  {
    dot: 'bg-sky-600',
    chip: 'bg-sky-50 text-sky-900',
    bar: 'border-sky-600',
  },
  {
    dot: 'bg-indigo-600',
    chip: 'bg-indigo-50 text-indigo-900',
    bar: 'border-indigo-600',
  },
  {
    dot: 'bg-rose-600',
    chip: 'bg-rose-50 text-rose-900',
    bar: 'border-rose-600',
  },
  {
    dot: 'bg-orange-600',
    chip: 'bg-orange-50 text-orange-900',
    bar: 'border-orange-600',
  },
  {
    dot: 'bg-amber-600',
    chip: 'bg-amber-50 text-amber-950',
    bar: 'border-amber-600',
  },
  {
    dot: 'bg-lime-600',
    chip: 'bg-lime-50 text-lime-900',
    bar: 'border-lime-600',
  },
  {
    dot: 'bg-fuchsia-600',
    chip: 'bg-fuchsia-50 text-fuchsia-900',
    bar: 'border-fuchsia-600',
  },
];

function hashProjectId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getProjectColorStyles(projectId: string | null | undefined) {
  if (!projectId) return PROJECT_COLOR_PALETTE[0];
  return PROJECT_COLOR_PALETTE[hashProjectId(projectId) % PROJECT_COLOR_PALETTE.length];
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatMonthYear(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date);
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function formatAgendaDayHeading(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(date));
}

function formatFullDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function isProjectItem(event: CalendarEventItem) {
  return event.source === 'project' || event.type === CalendarEventType.PROJECT;
}

function getEventStyles(event: CalendarEventItem) {
  if (isProjectItem(event)) {
    return getProjectColorStyles(event.projectId ?? event.id);
  }
  return EVENT_TYPE_STYLES[event.type];
}

function isMeetingLike(event: CalendarEventItem) {
  return !isProjectItem(event);
}

function eventOverlapsDay(event: CalendarEventItem, day: Date) {
  const start = startOfDay(new Date(event.startAt));
  const end = startOfDay(new Date(event.endAt));
  const target = startOfDay(day);
  return target >= start && target <= end;
}

function eachDayInRange(start: Date, end: Date) {
  const days: Date[] = [];
  const cursor = startOfDay(start);
  const last = startOfDay(end);
  while (cursor <= last) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function matchesFilter(event: CalendarEventItem, filter: CalendarFilter) {
  if (filter === 'all') return true;
  if (filter === 'projects') return isProjectItem(event);
  return isMeetingLike(event);
}

export function CalendarPage() {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [filter, setFilter] = useState<CalendarFilter>('all');
  const [showCreate, setShowCreate] = useState(false);
  const { data: currentUser } = useCurrentUser();
  const canManage = Boolean(
    currentUser?.roles.some((role) => CALENDAR_CREATE_ROLES.has(role)),
  );

  const range = useMemo(() => {
    const from = startOfMonth(currentMonth);
    const to = endOfMonth(currentMonth);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [currentMonth]);

  const { data: events, isLoading } = useQuery({
    queryKey: queryKeys.calendar.range(range.from),
    queryFn: () => fetchCalendarEvents(range.from, range.to),
  });

  const filteredEvents = useMemo(
    () => (events ?? []).filter((event) => matchesFilter(event, filter)),
    [events, filter],
  );

  const openEvent = (event: CalendarEventItem) => {
    if (isProjectItem(event) && event.projectId) {
      navigate(`/dashboard/projets/${event.projectId}`);
      return;
    }
    navigate(`/dashboard/calendrier/${event.id}`);
  };

  const calendarDays = useMemo(() => {
    const first = startOfMonth(currentMonth);
    const last = endOfMonth(currentMonth);
    const startPad = (first.getDay() + 6) % 7;
    const days: { date: Date; inMonth: boolean }[] = [];

    for (let i = startPad; i > 0; i -= 1) {
      const d = new Date(first);
      d.setDate(d.getDate() - i);
      days.push({ date: d, inMonth: false });
    }

    for (let d = 1; d <= last.getDate(); d += 1) {
      days.push({
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d),
        inMonth: true,
      });
    }

    while (days.length % 7 !== 0) {
      const next = new Date(days[days.length - 1].date);
      next.setDate(next.getDate() + 1);
      days.push({ date: next, inMonth: false });
    }

    return days;
  }, [currentMonth]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEventItem[]>();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    for (const event of filteredEvents) {
      if (isProjectItem(event)) {
        const spanStart = startOfDay(new Date(event.startAt));
        const spanEnd = startOfDay(new Date(event.endAt));
        const from = spanStart < monthStart ? monthStart : spanStart;
        const to = spanEnd > monthEnd ? monthEnd : spanEnd;
        for (const day of eachDayInRange(from, to)) {
          const key = dayKey(day);
          const list = map.get(key) ?? [];
          list.push(event);
          map.set(key, list);
        }
      } else {
        const key = dayKey(new Date(event.startAt));
        const list = map.get(key) ?? [];
        list.push(event);
        map.set(key, list);
      }
    }
    return map;
  }, [filteredEvents, currentMonth]);

  const monthEvents = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    return filteredEvents
      .filter((event) => {
        if (isProjectItem(event)) {
          const start = startOfDay(new Date(event.startAt));
          const end = startOfDay(new Date(event.endAt));
          return start <= monthEnd && end >= monthStart;
        }
        const d = new Date(event.startAt);
        return (
          d.getMonth() === currentMonth.getMonth() &&
          d.getFullYear() === currentMonth.getFullYear()
        );
      })
      .sort((a, b) => {
        if (isProjectItem(a) !== isProjectItem(b)) {
          return isProjectItem(a) ? 1 : -1;
        }
        return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
      });
  }, [filteredEvents, currentMonth]);

  const agendaEvents = useMemo(() => {
    if (!selectedDay) return monthEvents;
    return monthEvents.filter((event) => eventOverlapsDay(event, selectedDay));
  }, [monthEvents, selectedDay]);

  const agendaGroups = useMemo(() => {
    if (selectedDay) {
      return [
        {
          key: dayKey(selectedDay),
          label: formatAgendaDayHeading(selectedDay.toISOString()),
          events: agendaEvents,
        },
      ];
    }

    const groups: { key: string; label: string; events: CalendarEventItem[] }[] = [];
    for (const event of agendaEvents) {
      if (isProjectItem(event)) {
        const key = `project-span-${event.id}`;
        const existing = groups.find((group) => group.key === key);
        if (existing) {
          existing.events.push(event);
        } else {
          groups.push({
            key,
            label: 'Projets en cours',
            events: [event],
          });
        }
        continue;
      }

      const key = dayKey(new Date(event.startAt));
      const existing = groups.find((group) => group.key === key);
      if (existing) {
        existing.events.push(event);
      } else {
        groups.push({
          key,
          label: formatAgendaDayHeading(event.startAt),
          events: [event],
        });
      }
    }
    return groups;
  }, [agendaEvents, selectedDay]);

  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(startOfMonth(now));
    setSelectedDay(now);
  };

  const shiftMonth = (delta: number) => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1),
    );
    setSelectedDay(null);
  };

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Organisation"
        title="Calendrier"
        description="Réunions, événements et projets du club."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={goToToday}>
              Aujourd’hui
            </Button>
            {canManage && (
              <Button type="button" size="sm" onClick={() => setShowCreate(true)}>
                Ajouter une réunion
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-100 bg-neutral-0 p-3 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="flex items-center justify-between gap-2 sm:justify-start">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 w-9 px-0"
            onClick={() => shiftMonth(-1)}
            aria-label="Mois précédent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="min-w-[10rem] text-center font-display text-lg font-semibold capitalize tracking-tight text-primary-900 sm:min-w-[12rem]">
            {formatMonthYear(currentMonth)}
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 w-9 px-0"
            onClick={() => shiftMonth(1)}
            aria-label="Mois suivant"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3 sm:border-0 sm:pt-0">
          <div className="flex rounded-xl border border-neutral-100 bg-neutral-50/80 p-0.5">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                className={cn(
                  'rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors',
                  filter === option.id
                    ? 'bg-neutral-0 text-primary-900 shadow-sm'
                    : 'text-neutral-500 hover:text-primary-800',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="hidden h-4 w-px bg-neutral-100 sm:block" aria-hidden />
          {([
            CalendarEventType.MEETING,
            CalendarEventType.EVENT,
          ] as const).map((type) => (
            <span
              key={type}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-500"
            >
              <span
                className={cn('h-1.5 w-1.5 rounded-full', EVENT_TYPE_STYLES[type].dot)}
                aria-hidden
              />
              {CALENDAR_EVENT_TYPE_LABELS[type]}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
            <span className="flex items-center -space-x-0.5" aria-hidden>
              {PROJECT_COLOR_PALETTE.slice(0, 3).map((color) => (
                <span
                  key={color.dot}
                  className={cn('h-1.5 w-1.5 rounded-full ring-1 ring-neutral-0', color.dot)}
                />
              ))}
            </span>
            Projet
          </span>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(20rem,1fr)] xl:gap-6">
        <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-0 shadow-soft">
          <div className="grid grid-cols-7 border-b border-neutral-100 bg-neutral-50/80">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="px-1 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-400"
              >
                {day}
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-7">
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className="min-h-[4.5rem] border-b border-r border-neutral-50 p-2 lg:min-h-[5.5rem]"
                >
                  <DashboardSkeleton className="h-3 w-6" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {calendarDays.map(({ date, inMonth }) => {
                const key = dayKey(date);
                const dayEvents = eventsByDay.get(key) ?? [];
                const isToday = isSameDay(date, today);
                const isSelected = selectedDay ? isSameDay(date, selectedDay) : false;

                return (
                  <div
                    key={key}
                    className={cn(
                      'relative flex min-h-[4.5rem] flex-col border-b border-r border-neutral-50 p-1.5 lg:min-h-[5.75rem] lg:p-2',
                      !inMonth && 'bg-neutral-50/40',
                      isSelected && 'bg-primary-50/60',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedDay(date)}
                      className={cn(
                        'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-colors',
                        !inMonth && 'text-neutral-300 hover:bg-neutral-100',
                        inMonth && !isToday && 'text-neutral-700 hover:bg-primary-50',
                        isToday && 'bg-primary-700 text-neutral-0 hover:bg-primary-800',
                      )}
                      aria-label={formatFullDate(date.toISOString())}
                      aria-pressed={isSelected}
                    >
                      {date.getDate()}
                    </button>

                    <div className="mt-1 flex flex-1 flex-col gap-0.5">
                      {dayEvents.slice(0, 3).map((event) => {
                        const styles = getEventStyles(event);
                        return (
                          <button
                            key={event.id}
                            type="button"
                            onClick={() => openEvent(event)}
                            className={cn(
                              'hidden truncate rounded px-1 py-0.5 text-left text-[10px] font-medium leading-tight transition-opacity hover:opacity-80 md:block',
                              styles.chip,
                              isProjectItem(event) && cn('border-l-2', styles.bar),
                            )}
                          >
                            {event.title}
                          </button>
                        );
                      })}
                      {dayEvents.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedDay(date)}
                          className="mt-auto flex gap-0.5 md:hidden"
                          aria-label={`${dayEvents.length} événement${dayEvents.length > 1 ? 's' : ''}`}
                        >
                          {dayEvents.slice(0, 3).map((event) => (
                            <span
                              key={event.id}
                              className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                getEventStyles(event).dot,
                              )}
                            />
                          ))}
                        </button>
                      )}
                      {dayEvents.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setSelectedDay(date)}
                          className="hidden text-left text-[10px] text-neutral-400 hover:text-neutral-600 md:block"
                        >
                          +{dayEvents.length - 3}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside className="relative flex min-h-[24rem] flex-col overflow-hidden rounded-2xl border border-neutral-100/80 bg-gradient-to-b from-primary-50/40 via-neutral-0 to-neutral-0 shadow-soft">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-accent-50/30 to-transparent" aria-hidden />

          <div className="relative px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                  Agenda
                </p>
                <h3 className="mt-1.5 font-display text-xl font-semibold tracking-tight text-primary-900">
                  {selectedDay
                    ? formatAgendaDayHeading(selectedDay.toISOString())
                    : formatMonthYear(currentMonth)}
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  {agendaEvents.length === 0
                    ? 'Rien de planifié'
                    : `${agendaEvents.length} élément${agendaEvents.length > 1 ? 's' : ''}`}
                </p>
              </div>
              {selectedDay && (
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="mt-1 text-xs font-medium text-primary-600 transition-colors hover:text-primary-800"
                >
                  Voir le mois
                </button>
              )}
            </div>
          </div>

          <div className="relative flex-1 overflow-y-auto px-2 pb-4 sm:px-3">
            {isLoading && (
              <div className="space-y-3 px-3 pt-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <DashboardSkeleton key={i} className="h-16 rounded-2xl" />
                ))}
              </div>
            )}

            {!isLoading && agendaEvents.length === 0 && (
              <div className="flex h-full min-h-[12rem] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-500">
                  <CalendarDays className="h-5 w-5" aria-hidden />
                </div>
                <p className="mt-4 font-display text-base font-semibold text-primary-900">
                  {selectedDay ? 'Journée libre' : 'Mois tranquille'}
                </p>
                <p className="mt-1.5 max-w-[16rem] text-sm leading-relaxed text-neutral-500">
                  Les prochaines réunions et projets apparaîtront ici.
                </p>
              </div>
            )}

            {!isLoading &&
              agendaGroups.map((group) => (
                <div key={group.key} className="mb-5 last:mb-2">
                  {!selectedDay && (
                    <p className="mb-2 px-3 text-[11px] font-medium capitalize tracking-wide text-neutral-400">
                      {group.label}
                    </p>
                  )}

                  <div className="relative space-y-1">
                    {group.events.map((event, index) => {
                      const styles = getEventStyles(event);
                      const isLast = index === group.events.length - 1;
                      const project = isProjectItem(event);
                      const statusLabel =
                        event.projectStatus &&
                        PROJECT_STATUS_LABELS[event.projectStatus as ProjectStatus];

                      return (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => openEvent(event)}
                          className="group relative flex w-full gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-neutral-0/90"
                        >
                          <div className="relative flex w-11 shrink-0 flex-col items-center pt-0.5">
                            <span className="font-display text-sm font-semibold tabular-nums text-primary-900">
                              {project ? 'Projet' : formatTime(event.startAt)}
                            </span>
                            <span
                              className={cn(
                                'mt-2 h-1.5 w-1.5 rounded-full ring-4 ring-neutral-0',
                                styles.dot,
                              )}
                              aria-hidden
                            />
                            {!isLast && (
                              <span
                                className="absolute top-9 bottom-[-0.75rem] w-px bg-neutral-100"
                                aria-hidden
                              />
                            )}
                          </div>

                          <div
                            className={cn(
                              'min-w-0 flex-1 pb-1',
                              project && cn('border-l-2 pl-3', styles.bar),
                            )}
                          >
                            <p className="font-medium leading-snug text-primary-900 transition-colors group-hover:text-primary-700">
                              {event.title}
                            </p>
                            <p className="mt-1 text-[11px] font-medium tracking-wide text-neutral-400">
                              {project ? (
                                <>
                                  Projet
                                  {statusLabel ? ` · ${statusLabel}` : ''}
                                  {event.commissionName
                                    ? ` · ${event.commissionName}`
                                    : ''}
                                </>
                              ) : (
                                <>
                                  {CALENDAR_EVENT_TYPE_LABELS[event.type]}
                                  {' · '}
                                  {CALENDAR_EVENT_FORMAT_LABELS[event.format]}
                                  {event.format === CalendarEventFormat.IN_PERSON &&
                                  event.location
                                    ? ` · ${event.location}`
                                    : ''}
                                </>
                              )}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </aside>
      </div>

      {canManage && (
        <CreateMeetingSlideOver
          open={showCreate}
          onClose={() => setShowCreate(false)}
          defaultDate={selectedDay}
        />
      )}
    </DashboardPageShell>
  );
}
