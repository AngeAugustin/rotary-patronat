import { Link } from 'react-router-dom';
import { ArrowRight, Quote } from 'lucide-react';
import { ScrollReveal } from '../ScrollReveal';
import { SectionHeader } from '../SectionHeader';
import { Button } from '@/components/ui/button';
import { publicContainerClass } from '../../constants/layout';
import { CLUB_PRESIDENT_PATH } from '../../constants/club-president';
import { cn } from '@/lib/utils';

interface HomePresidentSectionProps {
  isLoading: boolean;
  isError: boolean;
  message?: string;
  name?: string;
  title?: string;
  photo?: string | null;
}

export function HomePresidentSection({
  isLoading,
  isError,
  message,
  name,
  title,
  photo,
}: HomePresidentSectionProps) {
  return (
    <section className={cn(publicContainerClass, 'py-20 lg:py-28')}>
      <SectionHeader
        align="left"
        eyebrow="Mot du Président"
        title="Créer un Impact Durable"
        className="mx-0 max-w-2xl text-left"
      />

      <ScrollReveal className="mt-12">
        {isLoading ? (
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="h-80 animate-pulse rounded-3xl bg-neutral-100 lg:col-span-5" />
            <div className="space-y-4 lg:col-span-7">
              <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
              <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-100" />
            </div>
          </div>
        ) : isError ? (
          <p className="text-neutral-700">
            Le contenu sera disponible dès que l&apos;API sera connectée.
          </p>
        ) : (
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-16">
            <div className="relative lg:col-span-5">
              <div
                className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-br from-accent-100 to-primary-100"
                aria-hidden
              />
              {photo ? (
                <img
                  src={photo}
                  alt={name ? `Portrait de ${name}` : 'Portrait du Président'}
                  className="relative aspect-[4/5] w-full rounded-3xl object-cover shadow-lift"
                  loading="lazy"
                />
              ) : (
                <div className="relative flex aspect-[4/5] w-full items-center justify-center rounded-3xl bg-gradient-to-br from-primary-100 to-primary-300 shadow-lift">
                  <span className="font-display text-6xl font-bold text-primary-700/30">
                    R
                  </span>
                </div>
              )}
            </div>

            <blockquote className="relative lg:col-span-7">
              <Quote
                className="absolute -left-2 -top-4 h-12 w-12 text-accent-300/80 lg:-left-6"
                aria-hidden
              />
              <p className="relative text-xl leading-relaxed text-neutral-700 md:text-2xl md:leading-relaxed">
                {message}
              </p>
              <footer className="mt-8 space-y-6 border-t border-neutral-100 pt-8">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-accent-500 to-transparent" />
                  <div className="text-right">
                    <cite className="not-italic font-semibold text-primary-900">
                      {name}
                    </cite>
                    <p className="text-sm text-neutral-400">{title}</p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to={CLUB_PRESIDENT_PATH}>
                    Lire plus
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </Button>
              </footer>
            </blockquote>
          </div>
        )}
      </ScrollReveal>
    </section>
  );
}
