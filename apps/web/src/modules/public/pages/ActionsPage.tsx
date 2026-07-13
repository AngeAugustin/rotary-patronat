import { useState } from 'react';
import { HandHeart } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { PageSection } from '../components/PageSection';
import { ScrollReveal } from '../components/ScrollReveal';
import { ActionCard, ActionCardSkeleton } from '../components/ActionCard';
import { PublicPagination } from '../components/PublicPagination';
import { PublicEmptyState } from '../components/PublicEmptyState';
import { useActions } from '../hooks/use-public-content';

const ACTIONS_HERO_IMAGE =
  'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1200&q=80';

export function ActionsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useActions(page);
  const actions = data?.data ?? [];
  const featured = actions.find((action) => action.featured) ?? actions[0];
  const rest =
    page === 1 && featured
      ? actions.filter((action) => action.id !== featured.id)
      : actions;

  return (
    <>
      <PageHero
        compact
        eyebrow="Nos actions"
        title="Servir les communautés"
        description="Des initiatives concrètes portées par le club en faveur de l’éducation, de la santé et du développement local."
        imageUrl={ACTIONS_HERO_IMAGE}
      />

      <PageSection tone="muted" className="pt-10 pb-16 sm:pt-12 sm:pb-20 lg:pt-14 lg:pb-24">
        <div className="flex flex-col gap-8 lg:gap-10">
          <ScrollReveal>
            <div className="flex flex-col gap-4 border-b border-neutral-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-700">
                  Impact local
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-primary-900 sm:text-[1.75rem]">
                  Initiatives du club
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600 sm:text-[15px]">
                  Projets et actions menés avec les commissions et les partenaires du Rotary.
                </p>
              </div>
              {data && (
                <div className="flex shrink-0 items-center gap-2.5 rounded-xl border border-neutral-200/70 bg-neutral-0/80 px-3.5 py-2.5 shadow-soft backdrop-blur-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                    <HandHeart className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                      Publiées
                    </p>
                    <p className="text-sm font-semibold tabular-nums text-primary-900">
                      {data.meta.total}
                      <span className="ml-1 font-normal text-neutral-500">
                        action{data.meta.total > 1 ? 's' : ''}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>

          {isError && (
            <p className="rounded-xl border border-red-100 bg-red-50/60 px-4 py-3 text-sm text-red-700">
              Impossible de charger les actions. Vérifiez que l&apos;API est démarrée.
            </p>
          )}

          {!isError && (
            <div className="space-y-6">
              {isLoading ? (
                <ActionsLoadingState />
              ) : actions.length === 0 ? (
                <PublicEmptyState message="Aucune action publiée pour le moment." />
              ) : (
                <>
                  {page === 1 && featured && (
                    <ScrollReveal>
                      <div className="space-y-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                          À la une
                        </p>
                        <ActionCard action={featured} layout="row" emphasis />
                      </div>
                    </ScrollReveal>
                  )}

                  {rest.length > 0 && (
                    <div className="space-y-3">
                      {page === 1 && featured && (
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                          Toutes les actions
                        </p>
                      )}
                      <div className="space-y-2.5">
                        {rest.map((action, index) => (
                          <ScrollReveal
                            key={action.id}
                            delay={Math.min(index * 0.04, 0.24)}
                          >
                            <ActionCard action={action} layout="row" />
                          </ScrollReveal>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {data && (
            <PublicPagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              onPageChange={setPage}
              className="mt-2 border-t border-neutral-200/80 pt-8"
            />
          )}
        </div>
      </PageSection>
    </>
  );
}

function ActionsLoadingState() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-3 w-16 animate-pulse rounded bg-neutral-200/80" />
        <ActionCardSkeleton layout="row" />
      </div>
      <div className="space-y-3">
        <div className="h-3 w-28 animate-pulse rounded bg-neutral-200/80" />
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <ActionCardSkeleton key={i} layout="row" />
          ))}
        </div>
      </div>
    </div>
  );
}
