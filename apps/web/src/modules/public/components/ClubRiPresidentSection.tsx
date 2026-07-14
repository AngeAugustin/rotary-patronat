import { Link } from 'react-router-dom';
import { ArrowRight, Quote } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';
import { SectionHeader } from './SectionHeader';
import { PageSection } from './PageSection';
import { Button } from '@/components/ui/button';
import { RI_PRESIDENT_OBJECTIVES_PATH } from '../constants/ri-president-objectives';
import { cn } from '@/lib/utils';

interface ClubRiPresidentSectionProps {
  name: string;
  title: string;
  bio: string;
  message: string;
  photo?: string | null;
}

export function ClubRiPresidentSection({
  name,
  title,
  bio,
  message,
  photo,
}: ClubRiPresidentSectionProps) {
  return (
    <PageSection>
      <SectionHeader
        align="left"
        eyebrow="Rotary International"
        title="Présentation du Président RI"
        description="Le message et le parcours du président du Rotary International."
        className="mx-0 max-w-2xl text-left"
      />

      <ScrollReveal className="mt-12">
        <article className="overflow-hidden rounded-[1.75rem] border border-neutral-100 bg-neutral-0 shadow-soft">
          <div className="grid lg:grid-cols-12">
            <div className="relative bg-primary-900 lg:col-span-4">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700" />
              <div
                className="absolute -right-10 top-10 h-40 w-40 rounded-full bg-accent-500/20 blur-3xl"
                aria-hidden
              />
              <div className="relative aspect-[4/5] sm:aspect-[5/6] lg:aspect-auto lg:min-h-full">
                {photo ? (
                  <img
                    src={photo}
                    alt={`Portrait de ${name}`}
                    className="h-full w-full object-cover object-top"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full min-h-[20rem] items-center justify-center bg-gradient-to-br from-primary-800 to-primary-950">
                    <span className="font-display text-6xl font-semibold text-primary-300/40">
                      {name
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part.charAt(0))
                        .join('')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-between gap-8 p-6 sm:p-8 lg:col-span-8 lg:p-10">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-700">
                  {title}
                </p>
                <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-primary-900 sm:text-3xl">
                  {name}
                </h3>
                <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-neutral-600 sm:text-base">
                  {bio}
                </p>
                <div className="mt-6">
                  <Button asChild variant="outline" size="sm">
                    <Link to={RI_PRESIDENT_OBJECTIVES_PATH}>
                      Lire ses objectifs
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </Button>
                </div>
              </div>

              <blockquote
                className={cn(
                  'relative rounded-2xl border border-primary-100/80 bg-gradient-to-br from-primary-50/90 via-neutral-0 to-accent-50/40 p-5 sm:p-6',
                )}
              >
                <Quote
                  className="mb-3 h-7 w-7 text-accent-500/80"
                  aria-hidden
                />
                <p className="text-[15px] leading-relaxed text-primary-900 sm:text-base sm:leading-relaxed">
                  {message}
                </p>
              </blockquote>
            </div>
          </div>
        </article>
      </ScrollReveal>
    </PageSection>
  );
}
