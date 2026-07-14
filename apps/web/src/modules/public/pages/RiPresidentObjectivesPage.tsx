import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Target } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { PageSection } from '../components/PageSection';
import { ScrollReveal } from '../components/ScrollReveal';
import { Button } from '@/components/ui/button';
import {
  riPresidentObjectives,
} from '../constants/ri-president-objectives';
import { cn } from '@/lib/utils';

export function RiPresidentObjectivesPage() {
  const { presidentName, presidentTitle, pageEyebrow, pageTitle, pageDescription, axes } =
    riPresidentObjectives;

  return (
    <>
      <PageHero
        compact
        eyebrow={pageEyebrow}
        title={pageTitle}
        description={pageDescription}
      />

      <PageSection tone="muted" className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-primary-100/50 blur-3xl"
          aria-hidden
        />

        <div className="relative mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              to="/le-club"
              className="group inline-flex items-center gap-2 text-sm font-medium text-neutral-400 transition-colors hover:text-primary-700"
            >
              <ArrowLeft
                className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
                aria-hidden
              />
              Retour au Club
            </Link>
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-700">
              {presidentTitle}
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-primary-900 sm:text-3xl">
              {presidentName}
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-neutral-500">
            Quatre axes pour guider l’action du Rotary International : santé, croissance,
            gouvernance et rayonnement.
          </p>
        </div>

        <ol className="relative space-y-6 lg:space-y-8">
          {axes.map((axis, index) => (
            <li key={axis.id}>
              <ScrollReveal delay={index * 0.05}>
                <article
                  className={cn(
                    'overflow-hidden rounded-[1.5rem] border border-neutral-200/80 bg-neutral-0/90 shadow-soft',
                  )}
                >
                  <div className="border-b border-neutral-100 bg-gradient-to-r from-primary-50/80 via-neutral-0 to-accent-50/40 px-5 py-5 sm:px-7 sm:py-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl bg-primary-700 px-2.5 font-display text-sm font-semibold text-neutral-0">
                        {String(axis.number).padStart(2, '0')}
                      </span>
                      <div>
                        <h3 className="font-display text-xl font-semibold tracking-tight text-primary-900 sm:text-2xl">
                          {axis.title}
                        </h3>
                        <p className="mt-1 text-sm text-neutral-600 sm:text-[15px]">
                          {axis.subtitle}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-0 lg:grid-cols-2">
                    <div className="border-b border-neutral-100 px-5 py-6 sm:px-7 lg:border-b-0 lg:border-r lg:border-neutral-100">
                      <div className="flex items-center gap-2 text-primary-800">
                        <Target className="h-4 w-4 text-accent-600" aria-hidden />
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                          Objectifs opérationnels
                        </p>
                      </div>
                      <ol className="mt-4 space-y-3">
                        {axis.objectives.map((objective, i) => (
                          <li
                            key={objective}
                            className="flex gap-3 text-sm leading-relaxed text-neutral-700 sm:text-[15px]"
                          >
                            <span className="mt-0.5 shrink-0 font-display text-xs font-semibold tabular-nums text-primary-400">
                              {i + 1}.
                            </span>
                            <span>{objective}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="bg-primary-50/30 px-5 py-6 sm:px-7">
                      <div className="flex items-center gap-2 text-primary-800">
                        <CheckCircle2 className="h-4 w-4 text-accent-600" aria-hidden />
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                          Indicateurs de réussite
                        </p>
                      </div>
                      <ul className="mt-4 space-y-3">
                        {axis.indicators.map((indicator) => (
                          <li
                            key={indicator}
                            className="flex gap-3 text-sm leading-relaxed text-neutral-700 sm:text-[15px]"
                          >
                            <span
                              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500"
                              aria-hidden
                            />
                            <span>{indicator}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex justify-center sm:mt-14">
          <Button asChild variant="outline">
            <Link to="/le-club">Retourner au Club</Link>
          </Button>
        </div>
      </PageSection>
    </>
  );
}
