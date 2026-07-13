import { useState } from 'react';
import { Newspaper, Search } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { PageSection } from '../components/PageSection';
import { PublicPagination } from '../components/PublicPagination';
import { PublicEmptyState } from '../components/PublicEmptyState';
import { NewsCard, NewsCardSkeleton } from '../components/NewsCard';
import { ScrollReveal } from '../components/ScrollReveal';
import { useNews, useNewsCategories } from '../hooks/use-public-content';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NEWS_HERO_IMAGE =
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80';

export function NewsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | undefined>();

  const { data: categories } = useNewsCategories();
  const { data, isLoading, isError } = useNews({ page, q: query, category });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(search.trim());
    setPage(1);
  };

  const categoryFilters = [
    {
      id: 'all',
      label: 'Toutes',
      active: !category,
      onClick: () => {
        setCategory(undefined);
        setPage(1);
      },
    },
    ...(categories?.map((cat) => ({
      id: cat.id,
      label: cat.name,
      active: category === cat.slug,
      onClick: () => {
        setCategory(cat.slug);
        setPage(1);
      },
    })) ?? []),
  ];

  const articles = data?.data ?? [];
  const lead = page === 1 && !query && !category ? articles[0] : undefined;
  const rest = lead ? articles.slice(1) : articles;

  return (
    <>
      <PageHero
        compact
        eyebrow="Nos actualités"
        title="La vie du club"
        description="Annonces, projets et moments forts de la communauté Rotary Le Nautile Patronat."
        imageUrl={NEWS_HERO_IMAGE}
      />

      <PageSection tone="muted" className="pt-10 pb-16 sm:pt-12 sm:pb-20 lg:pt-14 lg:pb-24">
        <div className="flex flex-col gap-8 lg:gap-10">
          <ScrollReveal>
            <div className="flex flex-col gap-4 border-b border-neutral-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-700">
                  Fil d’information
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-primary-900 sm:text-[1.75rem]">
                  Dernières publications
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600 sm:text-[15px]">
                  Retrouvez les communiqués et actualités du club, classés par thème.
                </p>
              </div>
              {data && (
                <div className="flex shrink-0 items-center gap-2.5 rounded-xl border border-neutral-200/70 bg-neutral-0/80 px-3.5 py-2.5 shadow-soft backdrop-blur-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                    <Newspaper className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                      Publiées
                    </p>
                    <p className="text-sm font-semibold tabular-nums text-primary-900">
                      {data.meta.total}
                      <span className="ml-1 font-normal text-neutral-500">
                        actualité{data.meta.total > 1 ? 's' : ''}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Recherche + filtres intégrés */}
          <ScrollReveal>
            <div className="space-y-3 rounded-2xl border border-neutral-200/70 bg-neutral-0/80 p-3.5 shadow-soft backdrop-blur-sm sm:p-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                    aria-hidden
                  />
                  <Input
                    placeholder="Rechercher une actualité…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border-neutral-100 bg-neutral-50/80 pl-9"
                    aria-label="Rechercher"
                  />
                </div>
                <Button type="submit" variant="outline" className="shrink-0">
                  Rechercher
                </Button>
              </form>

              {categoryFilters.length > 1 && (
                <div className="flex flex-wrap gap-1.5">
                  {categoryFilters.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={filter.onClick}
                      className={cn(
                        'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                        filter.active
                          ? 'bg-primary-700 text-neutral-0'
                          : 'bg-neutral-50 text-neutral-600 hover:bg-primary-50 hover:text-primary-800',
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ScrollReveal>

          {isError && (
            <p className="rounded-xl border border-red-100 bg-red-50/60 px-4 py-3 text-sm text-red-700">
              Impossible de charger les actualités.
            </p>
          )}

          {!isError && (
            <div className="space-y-6">
              {isLoading ? (
                <NewsLoadingState />
              ) : articles.length === 0 ? (
                <PublicEmptyState message="Aucune actualité trouvée." />
              ) : (
                <>
                  {lead && (
                    <ScrollReveal>
                      <div className="space-y-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                          À la une
                        </p>
                        <NewsCard article={lead} layout="row" emphasis />
                      </div>
                    </ScrollReveal>
                  )}

                  {rest.length > 0 && (
                    <div className="space-y-3">
                      {lead && (
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                          Toutes les actualités
                        </p>
                      )}
                      <div className="space-y-2.5">
                        {rest.map((article, index) => (
                          <ScrollReveal
                            key={article.id}
                            delay={Math.min(index * 0.04, 0.24)}
                          >
                            <NewsCard article={article} layout="row" />
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

function NewsLoadingState() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-3 w-16 animate-pulse rounded bg-neutral-200/80" />
        <NewsCardSkeleton layout="row" />
      </div>
      <div className="space-y-3">
        <div className="h-3 w-32 animate-pulse rounded bg-neutral-200/80" />
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <NewsCardSkeleton key={i} layout="row" />
          ))}
        </div>
      </div>
    </div>
  );
}
