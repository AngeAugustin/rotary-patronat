import { motion } from 'framer-motion';
import { ArrowRight, Clock, MapPin, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { scaleOnHover } from '@/design-system/motion';
import { cn } from '@/lib/utils';

interface MeetingCardProps {
  title: string;
  date: string;
  startTime: string;
  location: string;
  slug?: string;
  className?: string;
  variant?: 'default' | 'compact';
  /** Compact only: light for pages claires, dark pour le bandeau accueil. */
  tone?: 'light' | 'dark';
}

function parseMeetingDate(date: string) {
  return new Date(date);
}

function isOnlineLocation(location: string) {
  return /^https?:\/\//i.test(location.trim()) || /^en ligne$/i.test(location.trim());
}

function formatLocationLabel(location: string) {
  if (/^https?:\/\//i.test(location.trim())) return 'En ligne';
  return location;
}

export function MeetingCard({
  title,
  date,
  startTime,
  location,
  slug,
  className,
  variant = 'default',
  tone = 'light',
}: MeetingCardProps) {
  const isCompact = variant === 'compact';
  const isDark = isCompact && tone === 'dark';
  const meetingDate = parseMeetingDate(date);
  const day = new Intl.DateTimeFormat('fr-FR', { day: '2-digit' }).format(meetingDate);
  const month = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
    .format(meetingDate)
    .replace('.', '');
  const weekday = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' })
    .format(meetingDate)
    .replace('.', '');
  const online = isOnlineLocation(location);
  const locationLabel = formatLocationLabel(location);

  const content = (
    <div className={cn('flex h-full', isCompact ? 'gap-3.5 p-3.5' : 'gap-0')}>
      <div
        className={cn(
          'flex shrink-0 flex-col items-center justify-center text-center',
          isCompact && isDark && 'w-14 rounded-xl bg-white/10 px-2 py-2.5',
          isCompact &&
            !isDark &&
            'w-14 rounded-xl bg-gradient-to-b from-primary-700 to-primary-900 px-2 py-2.5 text-neutral-0',
          !isCompact &&
            'w-[5.25rem] bg-gradient-to-b from-primary-700 to-primary-900 px-3 py-5 text-neutral-0 sm:w-24',
        )}
      >
        <span
          className={cn(
            'font-medium uppercase tracking-[0.14em] text-[10px]',
            isDark ? 'text-primary-200' : 'text-primary-200',
          )}
        >
          {weekday}
        </span>
        <span
          className={cn(
            'font-display font-semibold leading-none tracking-tight',
            isCompact ? 'mt-1 text-2xl' : 'mt-1.5 text-3xl sm:text-4xl',
            isDark ? 'text-neutral-0' : 'text-neutral-0',
          )}
        >
          {day}
        </span>
        <span
          className={cn(
            'mt-1 font-semibold uppercase tracking-[0.16em]',
            isCompact ? 'text-[10px]' : 'text-[11px]',
            'text-accent-300',
          )}
        >
          {month}
        </span>
      </div>

      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col',
          isCompact ? 'justify-center pr-1' : 'justify-between gap-4 p-5 sm:p-6',
        )}
      >
        <div className="min-w-0">
          {!isCompact && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-700">
              Au programme
            </p>
          )}
          <h3
            className={cn(
              'font-display font-semibold leading-snug',
              isCompact && isDark && 'text-sm text-neutral-0',
              isCompact &&
                !isDark &&
                'text-sm text-primary-900 transition-colors group-hover:text-primary-700',
              !isCompact &&
                'mt-1.5 text-lg text-primary-900 transition-colors group-hover:text-primary-700 sm:text-xl',
            )}
          >
            {title}
          </h3>
        </div>

        <div
          className={cn(
            'flex flex-wrap items-center gap-x-3 gap-y-1.5',
            isCompact && isDark && 'mt-1.5 text-xs text-primary-100',
            isCompact && !isDark && 'mt-1.5 text-xs text-neutral-600',
            !isCompact && 'text-sm text-neutral-600',
          )}
        >
          <span className="inline-flex items-center gap-1.5">
            <Clock
              className={cn(
                'h-3.5 w-3.5 shrink-0',
                isDark ? 'text-accent-300' : 'text-primary-500',
              )}
              aria-hidden
            />
            <span className={cn(!isDark && 'font-medium text-primary-800')}>
              {startTime}
            </span>
          </span>
          <span
            className={cn(
              'hidden h-1 w-1 rounded-full sm:inline-block',
              isDark ? 'bg-primary-300/50' : 'bg-neutral-300',
            )}
            aria-hidden
          />
          <span className="inline-flex min-w-0 items-center gap-1.5">
            {online ? (
              <Video
                className={cn(
                  'h-3.5 w-3.5 shrink-0',
                  isDark ? 'text-accent-300' : 'text-primary-500',
                )}
                aria-hidden
              />
            ) : (
              <MapPin
                className={cn(
                  'h-3.5 w-3.5 shrink-0',
                  isDark ? 'text-accent-300' : 'text-primary-500',
                )}
                aria-hidden
              />
            )}
            <span className="truncate">{locationLabel}</span>
          </span>
        </div>

        {!isCompact && slug && (
          <div className="flex items-center gap-1.5 text-sm font-medium text-primary-700">
            <span className="transition-colors group-hover:text-primary-900">
              Voir le détail
            </span>
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden
            />
          </div>
        )}
      </div>
    </div>
  );

  const cardClass = cn(
    'group relative overflow-hidden',
    isCompact && isDark && 'rounded-2xl',
    isCompact &&
      !isDark &&
      'rounded-2xl border border-neutral-100/90 bg-neutral-0 shadow-soft transition-shadow hover:border-primary-200 hover:shadow-lift',
    !isCompact &&
      'rounded-2xl border border-neutral-100/90 bg-neutral-0 shadow-soft transition-shadow hover:shadow-lift',
    className,
  );

  if (slug) {
    return (
      <motion.article className={cardClass} {...(isCompact ? {} : scaleOnHover)}>
        <Link
          to={`/nos-reunions/${slug}`}
          className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          {content}
        </Link>
      </motion.article>
    );
  }

  return <article className={cardClass}>{content}</article>;
}

export function MeetingCardSkeleton({
  className,
  variant = 'default',
}: {
  className?: string;
  variant?: 'default' | 'compact';
}) {
  const isCompact = variant === 'compact';

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-0 shadow-soft',
        className,
      )}
    >
      <div className={cn('flex', isCompact ? 'gap-3.5 p-3.5' : '')}>
        <div
          className={cn(
            'shrink-0 animate-pulse bg-neutral-100',
            isCompact ? 'h-16 w-14 rounded-xl' : 'h-auto w-[5.25rem] sm:w-24',
          )}
        />
        <div className={cn('flex-1 space-y-3', isCompact ? 'py-1' : 'p-5 sm:p-6')}>
          {!isCompact && (
            <div className="h-3 w-24 animate-pulse rounded bg-neutral-100" />
          )}
          <div className="h-5 w-3/4 animate-pulse rounded-lg bg-neutral-100" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}
