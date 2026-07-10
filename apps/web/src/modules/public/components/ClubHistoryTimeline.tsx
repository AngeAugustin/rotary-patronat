import type { ClubTimelineEvent } from '@rotary/shared-types';
import { ScrollReveal } from './ScrollReveal';
import { SectionHeader } from './SectionHeader';
import { PageSection } from './PageSection';
import { cn } from '@/lib/utils';

interface ClubHistoryTimelineProps {
  events: ClubTimelineEvent[];
  intro?: string;
}

export function ClubHistoryTimeline({ events, intro }: ClubHistoryTimelineProps) {
  if (events.length === 0) return null;

  const firstYear = events[0]?.year;
  const lastYear = events[events.length - 1]?.year;

  return (
    <PageSection tone="muted" className="overflow-hidden">
      <SectionHeader
        align="left"
        eyebrow="Notre parcours"
        title="L'histoire visuelle du club"
        description={
          intro ??
          `De ${firstYear} à aujourd'hui, revivez les étapes qui ont façonné la vie du Rotary Club Le Nautile Patronat.`
        }
        className="mx-0 max-w-3xl text-left"
      />

      <div className="relative mt-16 md:mt-20">
        <div
          className="absolute bottom-8 left-5 top-0 w-0.5 bg-gradient-to-b from-accent-500 via-primary-300 to-primary-700 md:left-1/2 md:-translate-x-px"
          aria-hidden
        />

        <ol className="space-y-10 md:space-y-0">
          {events.map((event, index) => {
            const isLeft = index % 2 === 0;

            return (
              <li
                key={event.id}
                className="relative md:grid md:grid-cols-2 md:items-start md:gap-12 md:pb-20"
              >
                <ScrollReveal
                  delay={index * 0.06}
                  className={cn(
                    'pl-14 md:pl-0',
                    isLeft
                      ? 'md:col-start-1 md:pr-8'
                      : 'md:col-start-2 md:pl-8',
                  )}
                >
                  <TimelineCard
                    event={event}
                    className={cn(isLeft ? 'md:ml-auto' : 'md:mr-auto')}
                  />
                </ScrollReveal>

                <div
                  className="absolute left-5 top-6 z-10 -translate-x-1/2 md:left-1/2"
                  aria-hidden
                >
                  <span
                    className={cn(
                      'flex h-10 min-w-10 items-center justify-center rounded-full border-4 border-neutral-50 px-1 font-display text-xs font-bold shadow-soft',
                      event.highlight
                        ? 'bg-accent-500 text-primary-900'
                        : 'bg-primary-700 text-neutral-0',
                    )}
                  >
                    {event.year}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>

        <ScrollReveal className="relative flex justify-center pt-4">
          <div className="z-10 rounded-full border border-primary-200 bg-neutral-0 px-6 py-2.5 shadow-soft">
            <p className="text-sm font-semibold text-primary-700">
              Aujourd&apos;hui · {lastYear}
            </p>
          </div>
        </ScrollReveal>
      </div>
    </PageSection>
  );
}

interface TimelineCardProps {
  event: ClubTimelineEvent;
  className?: string;
}

function TimelineCard({ event, className }: TimelineCardProps) {
  return (
    <article
      className={cn(
        'max-w-lg overflow-hidden rounded-3xl border bg-neutral-0 shadow-soft transition-shadow hover:shadow-lift',
        event.highlight
          ? 'border-accent-200 ring-1 ring-accent-100'
          : 'border-neutral-100',
        className,
      )}
    >
      {event.imageUrl && (
        <div className="relative aspect-[16/9] overflow-hidden bg-primary-100">
          <img
            src={event.imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-900/50 to-transparent" />
        </div>
      )}

      <div className="p-6 md:p-7">
        <p
          className={cn(
            'text-sm font-semibold',
            event.highlight ? 'text-accent-700' : 'text-primary-500',
          )}
        >
          {event.year}
        </p>
        <h3 className="mt-1 font-display text-xl font-bold text-primary-900">
          {event.title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-neutral-700">
          {event.description}
        </p>
      </div>
    </article>
  );
}
