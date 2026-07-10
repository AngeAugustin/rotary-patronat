import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { PageSection } from '../components/PageSection';
import { PublicFilterBar } from '../components/PublicFilterBar';
import { PublicPagination } from '../components/PublicPagination';
import { PublicEmptyState } from '../components/PublicEmptyState';
import { ScrollReveal } from '../components/ScrollReveal';
import { fetchPublicDocumentCategories, fetchPublicDocuments } from '../api';
import { queryKeys } from '@/lib/query-keys';
import { DocumentCard } from '@/modules/library/components/DocumentCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
    setQuery(search);
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
        eyebrow="Ressources"
        title="Bibliothèque publique"
        description="Comptes rendus, documents institutionnels et ressources accessibles à tous."
        imageUrl={LIBRARY_HERO_IMAGE}
      />

      <PublicFilterBar filters={categoryFilters.length > 1 ? categoryFilters : undefined}>
        <form onSubmit={handleSearch} className="flex max-w-lg gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
            <Input
              placeholder="Rechercher un document…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              aria-label="Rechercher"
            />
          </div>
          <Button type="submit">Rechercher</Button>
        </form>
      </PublicFilterBar>

      <PageSection tone="muted" className="pt-12">
        {isError && (
          <p className="text-neutral-700">
            Impossible de charger les documents pour le moment.
          </p>
        )}

        {!isError && (
          <>
            <div className="space-y-4">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-28 animate-pulse rounded-3xl border border-neutral-100 bg-neutral-0"
                    />
                  ))
                : data?.data.map((doc, index) => (
                    <ScrollReveal key={doc.id} delay={index * 0.04}>
                      <DocumentCard document={doc} />
                    </ScrollReveal>
                  ))}
            </div>

            {data && data.data.length === 0 && (
              <PublicEmptyState message="Aucun document public trouvé." />
            )}

            {data && (
              <PublicPagination
                page={data.meta.page}
                totalPages={data.meta.totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </PageSection>
    </>
  );
}
