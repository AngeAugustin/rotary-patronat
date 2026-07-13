import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Search } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { PageSection } from '../components/PageSection';
import { PublicPagination } from '../components/PublicPagination';
import { PublicEmptyState } from '../components/PublicEmptyState';
import { ScrollReveal } from '../components/ScrollReveal';
import {
  PublicDocumentCard,
  PublicDocumentCardSkeleton,
} from '../components/PublicDocumentCard';
import { fetchPublicDocumentCategories, fetchPublicDocuments } from '../api';
import { queryKeys } from '@/lib/query-keys';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LIBRARY_HERO_IMAGE =
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80';

export function PublicLibraryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const { data: categories } = useQuery({
    queryKey: queryKeys.public.publicLibraryCategories,
    queryFn: fetchPublicDocumentCategories,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.public.publicLibrary(`${page}-${query}-${categoryId}`),
    queryFn: () =>
      fetchPublicDocuments({
        page,
        q: query || undefined,
        categoryId: categoryId || undefined,
      }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(search.trim());
    setPage(1);
  };

  const categoryFilters = [
    {
      id: 'all',
      label: 'Toutes',
      active: !categoryId,
      onClick: () => {
        setCategoryId('');
        setPage(1);
      },
    },
    ...(categories?.map((cat) => ({
      id: cat.id,
      label: cat.name,
      active: categoryId === cat.id,
      onClick: () => {
        setCategoryId(cat.id);
        setPage(1);
      },
    })) ?? []),
  ];

  return (
    <>
      <PageHero
        compact
        eyebrow="Ressources"
        title="Bibliothèque publique"
        description="Comptes rendus, documents institutionnels et ressources accessibles à tous."
        imageUrl={LIBRARY_HERO_IMAGE}
      />

      <PageSection tone="muted" className="pt-10 pb-16 sm:pt-12 sm:pb-20 lg:pt-14 lg:pb-24">
        <div className="flex flex-col gap-8 lg:gap-10">
          <ScrollReveal>
            <div className="flex flex-col gap-4 border-b border-neutral-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-700">
                  Documents publics
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-primary-900 sm:text-[1.75rem]">
                  Ressources du club
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600 sm:text-[15px]">
                  Parcourez et téléchargez les documents mis à disposition du public.
                </p>
              </div>
              {data && (
                <div className="flex shrink-0 items-center gap-2.5 rounded-xl border border-neutral-200/70 bg-neutral-0/80 px-3.5 py-2.5 shadow-soft backdrop-blur-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                    <BookOpen className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                      Disponibles
                    </p>
                    <p className="text-sm font-semibold tabular-nums text-primary-900">
                      {data.meta.total}
                      <span className="ml-1 font-normal text-neutral-500">
                        document{data.meta.total > 1 ? 's' : ''}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="space-y-3 rounded-2xl border border-neutral-200/70 bg-neutral-0/80 p-3.5 shadow-soft backdrop-blur-sm sm:p-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                    aria-hidden
                  />
                  <Input
                    placeholder="Rechercher un document…"
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
              Impossible de charger les documents pour le moment.
            </p>
          )}

          {!isError && (
            <div className="space-y-2.5">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <PublicDocumentCardSkeleton key={i} />
                ))
              ) : data && data.data.length > 0 ? (
                data.data.map((doc, index) => (
                  <ScrollReveal key={doc.id} delay={Math.min(index * 0.04, 0.24)}>
                    <PublicDocumentCard document={doc} />
                  </ScrollReveal>
                ))
              ) : (
                <PublicEmptyState message="Aucun document public trouvé." />
              )}
            </div>
          )}

          {data && data.data.length > 0 && (
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
