import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Mail, Phone, Target, UserRound } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { PageSection } from '../components/PageSection';
import { ScrollReveal } from '../components/ScrollReveal';
import { Button } from '@/components/ui/button';
import {
  getPublicCommissionBySlug,
  publicCommissions,
} from '../constants/public-commissions';
import { cn } from '@/lib/utils';

export function PublicCommissionDetailPage() {
  const { slug = '' } = useParams();
  const commission = getPublicCommissionBySlug(slug);

  if (!commission) {
    return <Navigate to="/le-club" replace />;
  }

  const otherCommissions = publicCommissions.filter((c) => c.slug !== commission.slug);

  return (
    <>
      <PageHero
        compact
        eyebrow="Commissions"
        title={commission.name}
        description={commission.shortDescription}
      />

      <PageSection tone="muted" className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -right-16 top-8 h-64 w-64 rounded-full bg-primary-100/50 blur-3xl"
          aria-hidden
        />

        <Link
          to="/le-club"
          className="group relative inline-flex items-center gap-2 text-sm font-medium text-neutral-400 transition-colors hover:text-primary-700"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
            aria-hidden
          />
          Retour au Club
        </Link>

        <div className="relative mt-10 grid gap-8 lg:grid-cols-12 lg:gap-10">
          <ScrollReveal className="lg:col-span-4">
            <aside className="overflow-hidden rounded-[1.5rem] border border-neutral-200/80 bg-neutral-0 shadow-soft lg:sticky lg:top-28">
              <div className="relative aspect-[4/5] bg-primary-50">
                {commission.contact.photo ? (
                  <img
                    src={commission.contact.photo}
                    alt={`Portrait de ${commission.contact.name}`}
                    className="h-full w-full object-cover object-top"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full min-h-[16rem] items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
                    <UserRound className="h-12 w-12 text-primary-400/70" aria-hidden />
                  </div>
                )}
              </div>

              <div className="p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-700">
                  Présidence
                </p>
                <h2 className="mt-2 font-display text-xl font-semibold tracking-tight text-primary-900">
                  {commission.contact.name}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                  {commission.contact.role}
                </p>

                {(commission.contact.email || commission.contact.phone) && (
                  <ul className="mt-6 space-y-3 border-t border-neutral-100 pt-5">
                    {commission.contact.email && (
                      <li>
                        <a
                          href={`mailto:${commission.contact.email}`}
                          className="inline-flex items-start gap-2.5 text-sm text-primary-800 transition-colors hover:text-accent-700"
                        >
                          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary-400" aria-hidden />
                          <span className="break-all">{commission.contact.email}</span>
                        </a>
                      </li>
                    )}
                    {commission.contact.phone && (
                      <li>
                        <a
                          href={`tel:${commission.contact.phone.replace(/\s/g, '')}`}
                          className="inline-flex items-center gap-2.5 text-sm text-primary-800 transition-colors hover:text-accent-700"
                        >
                          <Phone className="h-4 w-4 shrink-0 text-primary-400" aria-hidden />
                          {commission.contact.phone}
                        </a>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </aside>
          </ScrollReveal>

          <div className="lg:col-span-8 space-y-10">
            <ScrollReveal delay={0.04}>
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  Mission
                </p>
                <p className="mt-3 text-[15px] leading-relaxed text-neutral-700 sm:text-base sm:leading-[1.8]">
                  {commission.intro}
                </p>
              </section>
            </ScrollReveal>

            {commission.missionBlocks?.map((block, blockIndex) => (
              <ScrollReveal key={block.title} delay={0.05 + blockIndex * 0.03}>
                <section>
                  <h3 className="font-display text-xl font-semibold tracking-tight text-primary-900">
                    {block.title}
                  </h3>
                  <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                    {block.items.map((item) => (
                      <li
                        key={item.label}
                        className="rounded-2xl border border-neutral-200/80 bg-neutral-0/90 px-4 py-4"
                      >
                        <p className="text-sm font-semibold text-primary-900">{item.label}</p>
                        <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
                          {item.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              </ScrollReveal>
            ))}

            {commission.bulletGroups?.map((group) => (
              <ScrollReveal key={group.title} delay={0.08}>
                <section className="rounded-[1.5rem] border border-primary-100/80 bg-gradient-to-br from-primary-50/70 via-neutral-0 to-accent-50/30 px-5 py-6 sm:px-7">
                  <h3 className="font-display text-lg font-semibold text-primary-900">
                    {group.title}
                  </h3>
                  <ul className="mt-4 space-y-2.5">
                    {group.items.map((item) => (
                      <li
                        key={item}
                        className="flex gap-3 text-sm leading-relaxed text-neutral-700"
                      >
                        <span
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500"
                          aria-hidden
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </ScrollReveal>
            ))}

            {commission.closingNote && (
              <ScrollReveal delay={0.09}>
                <p className="rounded-2xl border border-accent-100 bg-accent-50/40 px-5 py-4 text-sm leading-relaxed text-primary-900 sm:text-[15px]">
                  {commission.closingNote}
                </p>
              </ScrollReveal>
            )}
          </div>
        </div>
      </PageSection>

      <PageSection>
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-700">
              Plan stratégique
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-primary-900 sm:text-3xl">
              Objectifs {commission.objectivesPeriod}
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-neutral-500">
            Ambitions chiffrées et actions concrètes pour ancrer l’impact de la commission.
          </p>
        </div>

        <ol className="space-y-6 lg:space-y-8">
          {commission.goals.map((goal, index) => (
            <li key={goal.title}>
              <ScrollReveal delay={index * 0.05}>
                <article className="overflow-hidden rounded-[1.5rem] border border-neutral-200/80 bg-neutral-0 shadow-soft">
                  <div className="border-b border-neutral-100 bg-gradient-to-r from-primary-50/90 via-neutral-0 to-accent-50/35 px-5 py-5 sm:px-7 sm:py-6">
                    <div className="flex flex-wrap items-start gap-3">
                      <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl bg-primary-700 px-2.5 font-display text-sm font-semibold text-neutral-0">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-primary-800">
                          <Target className="h-4 w-4 text-accent-600" aria-hidden />
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                            Objectif stratégique
                          </p>
                        </div>
                        <h3 className="mt-2 font-display text-lg font-semibold leading-snug tracking-tight text-primary-900 sm:text-xl">
                          {goal.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-5 sm:px-7 sm:py-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                      Actions associées
                    </p>
                    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                      {goal.actions.map((action) => (
                        <li
                          key={action}
                          className={cn(
                            'rounded-xl border border-neutral-100 bg-neutral-50/70 px-4 py-3.5',
                            'text-sm leading-relaxed text-neutral-700',
                          )}
                        >
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </ScrollReveal>
            </li>
          ))}
        </ol>
      </PageSection>

      {otherCommissions.length > 0 && (
        <PageSection tone="muted">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Autres commissions
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherCommissions.map((item) => (
              <Link
                key={item.slug}
                to={`/le-club/commissions/${item.slug}`}
                className="group rounded-2xl border border-neutral-200/80 bg-neutral-0 p-5 transition-colors hover:border-primary-200 hover:shadow-soft"
              >
                <h3 className="font-display text-base font-semibold text-primary-900 group-hover:text-primary-700">
                  {item.name}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-neutral-600">
                  {item.shortDescription}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-700">
                  Voir la fiche
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Button asChild variant="outline">
              <Link to="/le-club">Retourner au Club</Link>
            </Button>
          </div>
        </PageSection>
      )}
    </>
  );
}
