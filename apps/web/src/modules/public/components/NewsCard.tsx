import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { NewsSummary } from '@rotary/shared-types';
import { cn } from '@/lib/utils';

interface NewsCardProps {
  article: NewsSummary;
  className?: string;
  layout?: 'default' | 'featured' | 'row';
  /** Mise en avant visuelle soft (même format row). */
  emphasis?: boolean;
}

function formatDate(date: string | null, style: 'long' | 'short' = 'long') {
  if (!date) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: style === 'short' ? 'short' : 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function NewsCard({
  article,
  className,
  layout = 'default',
  emphasis = false,
}: NewsCardProps) {
  if (layout === 'row') {
    return (
      <NewsRowCard article={article} className={className} emphasis={emphasis} />
    );
  }

  const isFeatured = layout === 'featured';

  return (
    <article
      className={cn(
        'group overflow-hidden rounded-2xl border border-neutral-100/90 bg-neutral-0 shadow-soft transition-[border-color,box-shadow] duration-300 hover:border-primary-200/80 hover:shadow-lift',
        isFeatured && 'lg:flex lg:min-h-[280px]',
        className,
      )}
    >
      <Link
        to={`/nos-actualites/${article.slug}`}
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
          {article.coverImage ? (
            <img
              src={article.coverImage}
              alt=""
              className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 text-sm font-medium text-primary-600">
              Actualité
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-md bg-neutral-0/92 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-primary-800 backdrop-blur-sm">
            {article.category.name}
          </span>
        </div>
        <div
          className={cn(
            'flex flex-col gap-2 p-5',
            isFeatured && 'lg:flex-1 lg:justify-center lg:gap-2.5 lg:p-7',
          )}
        >
          <time
            className="text-[11px] font-medium text-neutral-400"
            dateTime={article.publishedAt ?? undefined}
          >
            {formatDate(article.publishedAt)}
          </time>
          <h3
            className={cn(
              'font-display font-semibold tracking-tight text-primary-900 transition-colors group-hover:text-primary-700',
              isFeatured ? 'text-xl lg:text-2xl' : 'text-lg',
            )}
          >
            {article.title}
          </h3>
          <p
            className={cn(
              'text-sm leading-relaxed text-neutral-600',
              isFeatured ? 'line-clamp-3' : 'line-clamp-2',
            )}
          >
            {article.excerpt}
          </p>
        </div>
      </Link>
    </article>
  );
}

function NewsRowCard({
  article,
  className,
  emphasis = false,
}: {
  article: NewsSummary;
  className?: string;
  emphasis?: boolean;
}) {
  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-xl border transition-[border-color,background-color,box-shadow] duration-300',
        emphasis
          ? 'border-primary-200/70 bg-gradient-to-r from-primary-50/90 via-neutral-0 to-neutral-0 shadow-soft hover:border-primary-300 hover:shadow-lift'
          : 'border-neutral-100/90 bg-neutral-0/90 hover:border-primary-200 hover:bg-neutral-0 hover:shadow-soft',
        className,
      )}
    >
      {emphasis && (
        <div
          className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary-400 to-primary-600"
          aria-hidden
        />
      )}
      <Link
        to={`/nos-actualites/${article.slug}`}
        className="grid grid-cols-[5.5rem_1fr] gap-4 p-3 sm:grid-cols-[7.5rem_1fr_auto] sm:items-center sm:gap-5 sm:p-3.5"
      >
        <div
          className={cn(
            'relative aspect-square overflow-hidden rounded-lg bg-primary-50 sm:aspect-[5/4] sm:h-[4.75rem]',
            emphasis && 'ring-1 ring-primary-200/60',
          )}
        >
          {article.coverImage ? (
            <img
              src={article.coverImage}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 text-[10px] font-medium uppercase tracking-wider text-primary-500">
              Actu
            </div>
          )}
        </div>

        <div className="min-w-0 self-center pr-1">
          <div className="flex flex-wrap items-center gap-2">
            {emphasis && (
              <span className="rounded bg-accent-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-800">
                À la une
              </span>
            )}
            <span className="rounded bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-800">
              {article.category.name}
            </span>
            <time
              className="text-[11px] font-medium text-neutral-400"
              dateTime={article.publishedAt ?? undefined}
            >
              {formatDate(article.publishedAt, 'short')}
            </time>
          </div>
          <h3 className="mt-1 font-display text-[15px] font-semibold leading-snug tracking-tight text-primary-900 transition-colors group-hover:text-primary-700 sm:text-base">
            {article.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-sm text-neutral-500 sm:line-clamp-2">
            {article.excerpt}
          </p>
        </div>

        <span
          className={cn(
            'absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border transition-colors sm:static',
            emphasis
              ? 'border-primary-200/70 bg-primary-50 text-primary-700 group-hover:border-primary-300 group-hover:bg-primary-100'
              : 'border-neutral-100 bg-neutral-50 text-primary-600 group-hover:border-primary-200 group-hover:bg-primary-50 group-hover:text-primary-800',
          )}
          aria-hidden
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </Link>
    </article>
  );
}

export function NewsCardSkeleton({
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
          <div className="h-3 w-24 animate-pulse rounded bg-neutral-100" />
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
        <div className="h-3 w-24 animate-pulse rounded bg-neutral-100" />
        <div className="h-5 w-3/4 animate-pulse rounded-lg bg-neutral-100" />
        <div className="h-3.5 w-full animate-pulse rounded bg-neutral-100" />
      </div>
    </div>
  );
}
