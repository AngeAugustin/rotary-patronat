import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MeetingSummary } from '@rotary/shared-types';
import { MeetingCard, MeetingCardSkeleton } from './MeetingCard';
import { useMeetings } from '../hooks/use-public-content';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function meetingDayKey(dateIso: string) {
  const date = new Date(dateIso);
  return dayKey(
    new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function formatMonthYear(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatAgendaDayHeading(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function PublicMeetingsCalendar() {
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => new Date());

  const range = useMemo(() => {
    const from = startOfMonth(currentMonth);
    const to = endOfMonth(currentMonth);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [currentMonth]);

  const { data, isLoading, isError } = useMeetings({
    from: range.from,
    to: range.to,
    limit: 100,
  });

  const meetings = data?.data ?? [];

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

  const meetingsByDay = useMemo(() => {
    const map = new Map<string, MeetingSummary[]>();
    for (const meeting of meetings) {
      const key = meetingDayKey(meeting.date);
      const list = map.get(key) ?? [];
      list.push(meeting);
      map.set(key, list);
    }
    return map;
  }, [meetings]);

  const agendaMeetings = useMemo(() => {
    if (!selectedDay) return meetings;
    return meetings.filter((meeting) => {
      const key = meetingDayKey(meeting.date);
      return key === dayKey(selectedDay);
    });
  }, [meetings, selectedDay]);

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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-100 bg-neutral-0 p-3 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center justify-between gap-2 sm:justify-start">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 w-10 px-0"
            onClick={() => shiftMonth(-1)}
            aria-label="Mois précédent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="min-w-[11rem] text-center font-display text-xl font-semibold capitalize tracking-tight text-primary-900 sm:min-w-[14rem] sm:text-2xl">
            {formatMonthYear(currentMonth)}
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 w-10 px-0"
            onClick={() => shiftMonth(1)}
            aria-label="Mois suivant"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-neutral-100 pt-3 sm:border-0 sm:pt-0">
          <p className="text-sm text-neutral-500">
            {isLoading
              ? 'Chargement…'
              : `${meetings.length} réunion${meetings.length > 1 ? 's' : ''} ce mois`}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={goToToday}>
            Aujourd’hui
          </Button>
        </div>
      </div>

      {isError && (
        <p className="text-neutral-700">
          Impossible de charger l’agenda pour le moment.
        </p>
      )}

      {!isError && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(22rem,1fr)]">
          <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-0 shadow-soft">
            <div className="grid grid-cols-7 border-b border-neutral-100 bg-gradient-to-b from-primary-50/80 to-neutral-50/60">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="px-1 py-3.5 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-700/70"
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
                    className="min-h-[5.5rem] border-b border-r border-neutral-50 p-2 lg:min-h-[7rem]"
                  >
                    <div className="h-6 w-6 animate-pulse rounded-full bg-neutral-100" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {calendarDays.map(({ date, inMonth }) => {
                  const key = dayKey(date);
                  const dayMeetings = meetingsByDay.get(key) ?? [];
                  const isToday = isSameDay(date, today);
                  const isSelected = selectedDay
                    ? isSameDay(date, selectedDay)
                    : false;
                  const hasMeetings = dayMeetings.length > 0;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDay(date)}
                      className={cn(
                        'relative flex min-h-[5.5rem] flex-col items-stretch border-b border-r border-neutral-50 p-1.5 text-left transition-colors lg:min-h-[7.25rem] lg:p-2.5',
                        !inMonth && 'bg-neutral-50/50',
                        inMonth && 'hover:bg-primary-50/40',
                        isSelected && 'bg-primary-50/70 ring-1 ring-inset ring-primary-200',
                      )}
                      aria-label={formatFullDate(date)}
                      aria-pressed={isSelected}
                    >
                      <span
                        className={cn(
                          'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
                          !inMonth && 'text-neutral-300',
                          inMonth && !isToday && 'text-neutral-700',
                          isToday && 'bg-primary-700 text-neutral-0',
                        )}
                      >
                        {date.getDate()}
                      </span>

                      <div className="mt-1.5 flex flex-1 flex-col gap-1">
                        {dayMeetings.slice(0, 2).map((meeting) => (
                          <span
                            key={meeting.id}
                            className="hidden truncate rounded-md bg-primary-100/80 px-1.5 py-1 text-[10px] font-medium leading-tight text-primary-800 md:block"
                          >
                            <span className="text-primary-500">{meeting.startTime}</span>
                            {' · '}
                            {meeting.title}
                          </span>
                        ))}
                        {dayMeetings.length > 2 && (
                          <span className="hidden text-[10px] font-medium text-primary-600 md:block">
                            +{dayMeetings.length - 2}
                          </span>
                        )}
                        {hasMeetings && (
                          <span className="mt-auto flex gap-0.5 md:hidden">
                            {dayMeetings.slice(0, 3).map((meeting) => (
                              <span
                                key={meeting.id}
                                className="h-1.5 w-1.5 rounded-full bg-accent-500"
                              />
                            ))}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="flex min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-0 shadow-soft">
            <div className="border-b border-neutral-100 bg-gradient-to-br from-primary-50/90 via-neutral-0 to-accent-50/30 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-700">
                Agenda
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold capitalize text-primary-900">
                {selectedDay
                  ? formatAgendaDayHeading(selectedDay)
                  : formatMonthYear(currentMonth)}
              </h3>
              <p className="mt-1 text-sm text-neutral-500">
                {selectedDay
                  ? `${agendaMeetings.length} réunion${agendaMeetings.length > 1 ? 's' : ''}`
                  : 'Sélectionnez un jour ou parcourez le mois'}
              </p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <MeetingCardSkeleton key={i} variant="compact" />
                ))
              ) : agendaMeetings.length === 0 ? (
                <div className="flex h-full min-h-[12rem] flex-col items-center justify-center px-4 text-center">
                  <p className="text-sm font-medium text-primary-900">
                    Aucune réunion
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {selectedDay
                      ? 'Rien de prévu ce jour-là.'
                      : 'Aucune réunion publique ce mois-ci.'}
                  </p>
                  {selectedDay && meetings.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedDay(null)}
                      className="mt-4 text-sm font-medium text-primary-700 underline-offset-2 hover:underline"
                    >
                      Voir tout le mois
                    </button>
                  )}
                </div>
              ) : (
                agendaMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    title={meeting.title}
                    date={meeting.date}
                    startTime={meeting.startTime}
                    location={meeting.location}
                    slug={meeting.slug}
                    variant="compact"
                    tone="light"
                  />
                ))
              )}
            </div>
          </aside>
        </div>
      )}

      {!isError && !isLoading && meetings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-700">
                Ce mois
              </p>
              <h3 className="mt-1 font-display text-xl font-semibold text-primary-900">
                Toutes les réunions
              </h3>
            </div>
          </div>
          <div className="grid gap-4">
            {meetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                title={meeting.title}
                date={meeting.date}
                startTime={meeting.startTime}
                location={meeting.location}
                slug={meeting.slug}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
