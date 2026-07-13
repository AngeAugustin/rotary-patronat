import { Link, useParams } from 'react-router-dom';
import { Calendar, HandHeart, MapPin, Play, Users } from 'lucide-react';
import { useAction } from '../hooks/use-public-content';
import { PublicDetailLayout } from '../components/PublicDetailLayout';
import { ScrollReveal } from '../components/ScrollReveal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { publicContainerClass } from '../constants/layout';

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

function DetailSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('space-y-3.5', className)}>
      <h2 className="font-display text-lg font-semibold tracking-tight text-primary-900">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ActionDetailPage() {
  const { slug = '' } = useParams();
  const { data, isLoading, isError } = useAction(slug);

  if (isLoading) {
    return (
      <div>
        <div className="bg-primary-900">
          <div
            className={cn(
              publicContainerClass,
              'max-w-6xl grid gap-8 py-10 sm:py-12 lg:grid-cols-2 lg:gap-12 lg:py-14',
            )}
          >
            <div>
              <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
              <div className="mt-6 h-10 w-4/5 animate-pulse rounded-lg bg-white/10" />
              <div className="mt-4 h-8 w-28 animate-pulse rounded-md bg-white/10" />
              <div className="mt-5 flex gap-2.5">
                <div className="h-9 w-36 animate-pulse rounded-lg bg-white/10" />
                <div className="h-9 w-28 animate-pulse rounded-lg bg-white/10" />
              </div>
            </div>
            <div className="aspect-[4/3] animate-pulse rounded-3xl bg-white/10 sm:aspect-[5/4]" />
          </div>
        </div>
        <div className={cn(publicContainerClass, 'max-w-6xl space-y-3 py-12')}>
          <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-neutral-100" />
          <div className="h-4 w-4/6 animate-pulse rounded bg-neutral-100" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={cn(publicContainerClass, 'max-w-6xl py-20 text-center')}>
        <p className="text-neutral-700">Action introuvable.</p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/nos-actions">Retour aux actions</Link>
        </Button>
      </div>
    );
  }

  return (
    <PublicDetailLayout
      contentWidth="wide"
      heroLayout="split"
      backTo="/nos-actions"
      backLabel="Retour aux actions"
      title={data.title}
      coverImage={data.coverImage}
      badge={
        data.featured ? (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-accent-500/95 px-3 py-1.5 text-xs font-semibold tracking-wide text-primary-950 backdrop-blur-sm">
            <HandHeart className="h-3.5 w-3.5" aria-hidden />
            À la une
          </span>
        ) : undefined
      }
      meta={
        <div className="space-y-3.5">
          <div className="flex flex-wrap gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-primary-50 backdrop-blur-sm">
              <Calendar className="h-4 w-4 text-accent-300" aria-hidden />
              {formatDate(data.date)}
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-primary-50 backdrop-blur-sm">
              <MapPin className="h-4 w-4 text-accent-300" aria-hidden />
              {data.location}
            </span>
          </div>
          {data.partners.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-200/80">
                Partenaires
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {data.partners.slice(0, 3).map((partner) => (
                  <li
                    key={partner}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-medium text-primary-50 backdrop-blur-sm"
                  >
                    <Users className="h-3.5 w-3.5 text-accent-300" aria-hidden />
                    {partner}
                  </li>
                ))}
                {data.partners.length > 3 && (
                  <li className="inline-flex items-center rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-medium text-primary-100/80 backdrop-blur-sm">
                    +{data.partners.length - 3}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-10">
        {data.summary && (
          <p className="border-l-2 border-primary-300 pl-4 text-base leading-relaxed text-neutral-700 sm:text-lg">
            {data.summary}
          </p>
        )}

        <DetailSection title="L’action">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-700 sm:text-base">
            {data.description}
          </p>
        </DetailSection>

        {data.results && (
          <ScrollReveal>
            <div className="rounded-2xl border border-accent-100/90 bg-gradient-to-br from-accent-50/80 via-neutral-0 to-neutral-0 p-5 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-700">
                Impact
              </p>
              <h2 className="mt-1.5 font-display text-lg font-semibold tracking-tight text-primary-900">
                Résultats obtenus
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-700">
                {data.results}
              </p>
            </div>
          </ScrollReveal>
        )}

        {data.partners.length > 0 && (
          <ScrollReveal>
            <DetailSection title="Partenaires">
              <ul className="flex flex-wrap gap-2">
                {data.partners.map((partner) => (
                  <li
                    key={partner}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-100 bg-neutral-50/80 px-3 py-1.5 text-sm text-neutral-700"
                  >
                    <Users className="h-3 w-3 text-primary-400" aria-hidden />
                    {partner}
                  </li>
                ))}
              </ul>
            </DetailSection>
          </ScrollReveal>
        )}

        {data.gallery.length > 0 && (
          <ScrollReveal>
            <DetailSection
              title="Galerie"
              className="space-y-4"
            >
              <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                {data.gallery.map((url, index) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      'group relative overflow-hidden rounded-xl bg-neutral-100',
                      index === 0 && data.gallery.length % 2 === 1
                        ? 'aspect-[16/10] sm:col-span-2'
                        : 'aspect-[4/3]',
                    )}
                  >
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            </DetailSection>
          </ScrollReveal>
        )}

        {data.videos.length > 0 && (
          <ScrollReveal>
            <DetailSection title="Vidéos">
              <ul className="space-y-2">
                {data.videos.map((video) => (
                  <li key={video.url}>
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/60 px-3.5 py-3 transition-colors hover:border-primary-200 hover:bg-primary-50/40"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 transition-colors group-hover:bg-primary-200/70">
                        <Play className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <span className="min-w-0 truncate text-sm font-medium text-primary-900">
                        {video.title}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </DetailSection>
          </ScrollReveal>
        )}

        <div className="border-t border-neutral-100 pt-8">
          <Button asChild variant="outline" size="sm">
            <Link to="/nos-actions">Voir toutes les actions</Link>
          </Button>
        </div>
      </div>
    </PublicDetailLayout>
  );
}
