import { Link } from 'react-router-dom';
import { ArrowUpRight, Calendar, MapPin } from 'lucide-react';
import type { ActionSummary } from '@rotary/shared-types';
import { cn } from '@/lib/utils';

interface ActionCardProps {
  action: ActionSummary;
  className?: string;
  layout?: 'default' | 'featured' | 'row';
}

function formatDate(date: string, style: 'long' | 'short' = 'long') {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: style === 'short' ? 'short' : 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function ActionCard({ action, className, layout = 'default' }: ActionCardProps) {
  if (layout === 'row') {
    return <ActionRowCard action={action} className={className} />;
  }

  const isFeatured = layout === 'featured';

  return (
    <article
      className={cn(
        'group overflow-hidden rounded-2xl border border-neutral-100/90 bg-neutral-0 shadow-soft transition-[border-color,box-shadow] duration-300 hover:border-primary-200/80 hover:shadow-lift',
        isFeatured && 'lg:flex lg:min-h-[300px]',
        className,
      )}
    >
      <Link
        to={`/nos-actions/${action.slug}`}
        className={cn('block focus-visible:outline-none', isFeatured && 'lg:flex lg:w-full')}
      >
        <div
          className={cn(
            'relative overflow-hidden bg-primary-50',
            isFeatured
              ? 'aspect-[16/10] lg:aspect-auto lg:min-h-full lg:w-[48%]'
              : 'aspect-[16/10]',
          )}
        >
          {action.coverImage ? (
            <img
              src={action.coverImage}
              alt=""
              className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 text-sm font-medium text-primary-600">
              Action
            </div>
          )}
          {action.featured && (
            <span className="absolute left-3 top-3 rounded-md bg-accent-500/95 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-primary-950">
              À la une
            </span>
          )}
        </div>
        <div
          className={cn(
            'flex flex-col gap-2.5 p-5',
            isFeatured && 'lg:flex-1 lg:justify-center lg:gap-3 lg:p-7',
          )}
        >
          <h3
            className={cn(
              'font-display font-semibold tracking-tight text-primary-900 transition-colors group-hover:text-primary-700',
              isFeatured ? 'text-xl lg:text-2xl' : 'text-lg',
            )}
          >
            {action.title}
          </h3>
          {action.summary && (
            <p
              className={cn(
                'text-sm leading-relaxed text-neutral-600',
                isFeatured ? 'line-clamp-3' : 'line-clamp-2',
              )}
            >
              {action.summary}
            </p>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-neutral-400">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary-400" aria-hidden />
              {formatDate(action.date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary-400" aria-hidden />
              <span className="truncate">{action.location}</span>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

function ActionRowCard({
  action,
  className,
}: {
  action: ActionSummary;
  className?: string;
}) {
  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-xl border border-neutral-100/90 bg-neutral-0/90 transition-[border-color,background-color,box-shadow] duration-300 hover:border-primary-200 hover:bg-neutral-0 hover:shadow-soft',
        className,
      )}
    >
      <Link
        to={`/nos-actions/${action.slug}`}
        className="grid grid-cols-[5.5rem_1fr] gap-4 p-3 sm:grid-cols-[7.5rem_1fr_auto] sm:items-center sm:gap-5 sm:p-3.5"
      >
        <div className="relative aspect-square overflow-hidden rounded-lg bg-primary-50 sm:aspect-[5/4] sm:h-[4.75rem]">
          {action.coverImage ? (
            <img
              src={action.coverImage}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 text-[10px] font-medium uppercase tracking-wider text-primary-500">
              Action
            </div>
          )}
        </div>

        <div className="min-w-0 self-center pr-1">
          <div className="flex flex-wrap items-center gap-2">
            {action.featured && (
              <span className="rounded bg-accent-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-800">
                À la une
              </span>
            )}
            <time
              className="text-[11px] font-medium text-neutral-400"
              dateTime={action.date}
            >
              {formatDate(action.date, 'short')}
            </time>
          </div>
          <h3 className="mt-1 font-display text-[15px] font-semibold leading-snug tracking-tight text-primary-900 transition-colors group-hover:text-primary-700 sm:text-base">
            {action.title}
          </h3>
          {action.summary && (
            <p className="mt-1 line-clamp-1 text-sm text-neutral-500 sm:line-clamp-2">
              {action.summary}
            </p>
          )}
          <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-neutral-400 sm:mt-2">
            <MapPin className="h-3 w-3 shrink-0 text-primary-400" aria-hidden />
            <span className="truncate">{action.location}</span>
          </p>
        </div>

        <span
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-100 bg-neutral-50 text-primary-600 opacity-100 transition-colors group-hover:border-primary-200 group-hover:bg-primary-50 group-hover:text-primary-800 sm:static sm:opacity-100"
          aria-hidden
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </Link>
    </article>
  );
}

export function ActionCardSkeleton({
  className,
  layout = 'default',
}: {
  className?: string;
  layout?: 'default' | 'featured' | 'row';
}) {
  if (layout === 'row') {
    return (
      <div
        className={cn(
          'grid grid-cols-[5.5rem_1fr] gap-4 rounded-xl border border-neutral-100 bg-neutral-0 p-3 sm:grid-cols-[7.5rem_1fr]',
          className,
        )}
      >
        <div className="aspect-square animate-pulse rounded-lg bg-neutral-100 sm:aspect-[5/4] sm:h-[4.75rem]" />
        <div className="space-y-2 self-center">
          <div className="h-3 w-20 animate-pulse rounded bg-neutral-100" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-100" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-100" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-0 shadow-soft',
        className,
      )}
    >
      <div className="aspect-[16/10] animate-pulse bg-neutral-100" />
      <div className="space-y-2.5 p-5">
        <div className="h-5 w-3/4 animate-pulse rounded-lg bg-neutral-100" />
        <div className="h-3.5 w-full animate-pulse rounded bg-neutral-100" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-100" />
      </div>
    </div>
  );
}
