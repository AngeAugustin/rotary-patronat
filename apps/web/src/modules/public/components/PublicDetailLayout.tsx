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
  /**
   * overlay : image en fond plein cadre.
   * split : fond bleu + image à droite (actions, actualités).
   */
  heroLayout?: 'overlay' | 'split';
}

function BackLink({
  to,
  label,
  size,
  tone,
}: {
  to: string;
  label: string;
  size: 'sm' | 'base';
  tone: 'onDark' | 'onLight';
}) {
  return (
    <Link
      to={to}
      className={cn(
        'group inline-flex w-fit items-center gap-2 font-medium transition-colors',
        size === 'base' ? 'text-base' : 'text-sm',
        tone === 'onDark'
          ? 'text-primary-100/90 hover:text-neutral-0'
          : 'text-neutral-400 hover:text-primary-700',
      )}
    >
      <ArrowLeft
        className={cn(
          'transition-transform group-hover:-translate-x-0.5',
          size === 'base' ? 'h-5 w-5' : 'h-4 w-4',
        )}
        aria-hidden
      />
      {label}
    </Link>
  );
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
  heroLayout = 'overlay',
}: PublicDetailLayoutProps) {
  const contentMax =
    contentWidth === 'wide' ? 'max-w-6xl' : 'max-w-3xl';
  const isWide = contentWidth === 'wide';
  const linkSize = isWide ? 'base' : 'sm';
  const titleClass = cn(
    'font-display font-semibold tracking-tight',
    isWide
      ? 'text-3xl sm:text-4xl md:text-5xl'
      : 'text-2xl sm:text-3xl md:text-4xl',
  );

  const textBlock = (
    <>
      <BackLink to={backTo} label={backLabel} size={linkSize} tone="onDark" />
      <h1 className={cn(titleClass, 'mt-5 max-w-4xl text-neutral-0')}>{title}</h1>
      {badge && <div className="mt-3">{badge}</div>}
      {meta && <div className="mt-3.5">{meta}</div>}
      {actions && <div className="mt-3">{actions}</div>}
    </>
  );

  return (
    <article className={className}>
      {heroLayout === 'split' ? (
        <section className="relative overflow-hidden bg-primary-900 text-neutral-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700" />
          <div
            className="absolute -right-24 top-10 h-80 w-80 rounded-full bg-accent-500/20 blur-3xl"
            aria-hidden
          />
          <div
            className="absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-primary-500/30 blur-3xl"
            aria-hidden
          />

          <div
            className={cn(
              publicContainerClass,
              contentMax,
              'relative grid items-center gap-8 py-10 sm:py-12 lg:grid-cols-2 lg:gap-12 lg:py-14',
            )}
          >
            <div className="min-w-0">{textBlock}</div>

            {coverImage && (
              <div className="relative">
                <div
                  className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-accent-500/25 to-primary-300/20 blur-sm"
                  aria-hidden
                />
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-lift ring-1 ring-white/15 sm:aspect-[5/4]">
                  <img
                    src={coverImage}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="eager"
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      ) : coverImage ? (
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
            <BackLink to={backTo} label={backLabel} size={linkSize} tone="onDark" />
            <h1 className={cn(titleClass, 'mt-5 max-w-3xl text-neutral-0')}>{title}</h1>
            {badge && <div className="mt-3">{badge}</div>}
            {meta && <div className="mt-3.5">{meta}</div>}
            {actions && <div className="mt-3">{actions}</div>}
          </div>
        </div>
      ) : (
        <div className={cn(publicContainerClass, contentMax, 'pt-8 sm:pt-10')}>
          <BackLink to={backTo} label={backLabel} size={linkSize} tone="onLight" />
          <h1 className={cn(titleClass, 'mt-4 text-primary-900')}>{title}</h1>
          {badge && <div className="mt-3">{badge}</div>}
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
