import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';
import { publicContainerClass } from '../constants/layout';
import { cn } from '@/lib/utils';

interface PublicDetailLayoutProps {
  backTo: string;
  backLabel: string;
  title: string;
  coverImage?: string | null;
  badge?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Largeur du contenu (défaut article). */
  contentWidth?: 'article' | 'wide';
}

export function PublicDetailLayout({
  backTo,
  backLabel,
  title,
  coverImage,
  badge,
  meta,
  actions,
  children,
  className,
  contentWidth = 'article',
}: PublicDetailLayoutProps) {
  const contentMax =
    contentWidth === 'wide' ? 'max-w-5xl' : 'max-w-3xl';

  return (
    <article className={className}>
      {coverImage ? (
        <div className="relative h-[min(42vh,340px)] overflow-hidden bg-primary-900 sm:h-[min(46vh,400px)]">
          <img
            src={coverImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-950 via-primary-900/55 to-primary-900/25" />
          <div
            className={cn(
              publicContainerClass,
              contentMax,
              'relative flex h-full flex-col justify-end pb-7 pt-16 sm:pb-9 sm:pt-20',
            )}
          >
            <Link
              to={backTo}
              className="group mb-5 inline-flex w-fit items-center gap-2 text-sm font-medium text-primary-100/90 transition-colors hover:text-neutral-0"
            >
              <ArrowLeft
                className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
                aria-hidden
              />
              {backLabel}
            </Link>
            {badge}
            <h1 className="mt-2.5 max-w-3xl font-display text-2xl font-semibold tracking-tight text-neutral-0 sm:text-3xl md:text-4xl">
              {title}
            </h1>
            {meta && <div className="mt-3.5">{meta}</div>}
            {actions && <div className="mt-3">{actions}</div>}
          </div>
        </div>
      ) : (
        <div className={cn(publicContainerClass, contentMax, 'pt-8 sm:pt-10')}>
          <Link
            to={backTo}
            className="group inline-flex items-center gap-2 text-sm font-medium text-neutral-400 transition-colors hover:text-primary-700"
          >
            <ArrowLeft
              className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
              aria-hidden
            />
            {backLabel}
          </Link>
          {badge}
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-primary-900 sm:text-3xl md:text-4xl">
            {title}
          </h1>
          {meta && <div className="mt-3.5">{meta}</div>}
          {actions && <div className="mt-3">{actions}</div>}
        </div>
      )}

      <div className={cn(publicContainerClass, contentMax, 'py-10 sm:py-12 lg:py-14')}>
        <ScrollReveal>{children}</ScrollReveal>
      </div>
    </article>
  );
}
