import { Link } from 'react-router-dom';
import { ArrowLeft, Quote } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { PageSection } from '../components/PageSection';
import { ScrollReveal } from '../components/ScrollReveal';
import { Button } from '@/components/ui/button';
import { clubPresidentPresentation } from '../constants/club-president';
import { useHomepage } from '../hooks/use-public-content';
import { cn } from '@/lib/utils';

export function ClubPresidentPage() {
  const { data } = useHomepage();
  const photo = data?.presidentPhoto;
  const {
    name,
    title,
    term,
    district,
    bio,
    message,
    priorities,
  } = clubPresidentPresentation;

  return (
    <>
      <PageHero
        compact
        eyebrow="Le Club"
        title="Présentation du Président"
        description="Découvrez le parcours et le message du Président du Rotary Club Cotonou Le Nautile Patronat."
      />

      <PageSection tone="muted" className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -left-16 top-10 h-64 w-64 rounded-full bg-primary-100/50 blur-3xl"
          aria-hidden
        />

        <Link
          to="/"
          className="group relative inline-flex items-center gap-2 text-sm font-medium text-neutral-400 transition-colors hover:text-primary-700"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
            aria-hidden
          />
          Retour à l&apos;accueil
        </Link>

        <div className="relative mt-10 grid gap-12 lg:grid-cols-12 lg:gap-14 lg:items-start">
          <ScrollReveal className="lg:col-span-4">
            <aside className="lg:sticky lg:top-28">
              <div className="relative mx-auto max-w-sm">
                <div
                  className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-br from-accent-100/80 to-primary-100/70"
                  aria-hidden
                />
                {photo ? (
                  <img
                    src={photo}
                    alt={`Portrait de ${name}`}
                    className="relative aspect-[4/5] w-full rounded-3xl object-cover object-top shadow-lift"
                  />
                ) : (
                  <div className="relative flex aspect-[4/5] w-full items-center justify-center rounded-3xl bg-gradient-to-br from-primary-100 to-primary-300 shadow-lift">
                    <span className="font-display text-6xl font-bold text-primary-700/30">
                      R
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-7 text-center lg:text-left">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-700">
                  Mandat {term}
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-primary-900 sm:text-3xl">
                  {name}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">{title}</p>
                <p className="mt-2 text-sm font-medium text-primary-800">{district}</p>
              </div>
            </aside>
          </ScrollReveal>

          <div className="lg:col-span-8 space-y-10">
            <ScrollReveal delay={0.04}>
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  Parcours
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-primary-900">
                  Qui est le Président ?
                </h3>
                <div className="mt-5 space-y-4">
                  {bio.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-[15px] leading-relaxed text-neutral-600 sm:text-base sm:leading-[1.75]"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={0.08}>
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  Priorités du mandat
                </p>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {priorities.map((priority, index) => (
                    <li
                      key={priority}
                      className="flex items-start gap-3 rounded-2xl border border-neutral-200/80 bg-neutral-0/80 px-4 py-3.5"
                    >
                      <span className="mt-0.5 font-display text-xs font-semibold tabular-nums text-accent-700">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="text-sm font-medium leading-snug text-primary-900">
                        {priority}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <section
                className={cn(
                  'rounded-[1.75rem] border border-primary-100/80 bg-gradient-to-br from-primary-50/70 via-neutral-0 to-accent-50/30',
                  'px-5 py-7 sm:px-8 sm:py-9',
                )}
              >
                <div className="flex items-center gap-3">
                  <Quote className="h-7 w-7 text-accent-500/80" aria-hidden />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-700">
                      Mot du Président
                    </p>
                    <h3 className="mt-1 font-display text-xl font-semibold tracking-tight text-primary-900 sm:text-2xl">
                      Créer un Impact Durable
                    </h3>
                  </div>
                </div>

                <div className="mt-7 space-y-5">
                  <p className="text-[15px] font-medium text-primary-900 sm:text-base">
                    {message.greeting}
                  </p>
                  {message.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-[15px] leading-relaxed text-neutral-700 sm:text-base sm:leading-[1.8]"
                    >
                      {paragraph}
                    </p>
                  ))}
                  <p className="pt-2 text-right font-display text-base font-semibold text-primary-900">
                    {message.signature}
                  </p>
                </div>
              </section>
            </ScrollReveal>

            <div className="flex justify-center sm:justify-start">
              <Button asChild variant="outline">
                <Link to="/">Retourner à l&apos;accueil</Link>
              </Button>
            </div>
          </div>
        </div>
      </PageSection>
    </>
  );
}
