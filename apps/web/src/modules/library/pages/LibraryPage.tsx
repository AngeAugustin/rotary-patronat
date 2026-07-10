import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Library, Search } from 'lucide-react';
import { fetchDocumentCategories, fetchDocuments, recordDocumentDownload } from '../api';
import { DocumentCard } from '../components/DocumentCard';
import { CreateDocumentSlideOver } from '../components/CreateDocumentSlideOver';
import { queryKeys } from '@/lib/query-keys';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useIsAdmin } from '@/hooks/use-role';
import { cn } from '@/lib/utils';
import {
  DashboardPageShell,
  DashboardPageHeader,
  DashboardEmptyState,
  DashboardSkeleton,
  DashboardPagination,
} from '@/modules/dashboard/components/layout';

export function LibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryId = searchParams.get('category') ?? '';
  const searchQ = searchParams.get('q') ?? '';
  const [q, setQ] = useState(searchQ);
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();
  const isAdmin = useIsAdmin();

  const { data: categories } = useQuery({
    queryKey: queryKeys.library.categories,
    queryFn: fetchDocumentCategories,
  });

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.library.list(`${page}-${categoryId}-${searchQ}`),
    queryFn: () =>
      fetchDocuments({
        page,
        categoryId: categoryId || undefined,
        q: searchQ || undefined,
      }),
  });

  const totalDocuments =
    categories?.reduce((sum, category) => sum + category.documentCount, 0) ?? 0;

  const downloadMutation = useMutation({
    mutationFn: recordDocumentDownload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library', 'list'] });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (q) params.set('q', q);
    else params.delete('q');
    setSearchParams(params);
    setPage(1);
  };

  const setCategoryFilter = (nextCategoryId: string) => {
    const params = new URLSearchParams(searchParams);
    if (nextCategoryId) params.set('category', nextCategoryId);
    else params.delete('category');
    setSearchParams(params);
    setPage(1);
  };

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Ressources"
        title="Bibliothèque"
        description="Comptes rendus, procès-verbaux, guides et documents du club."
        action={
          isAdmin ? (
            <Button type="button" onClick={() => setShowCreate(true)}>
              Ajouter un document
            </Button>
          ) : undefined
        }
      />

      <form onSubmit={handleSearch} className="dashboard-toolbar">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un document…"
          className="border-0 bg-transparent shadow-none focus-visible:ring-0 sm:flex-1"
        />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="h-9 w-9 shrink-0 px-0"
          aria-label="Rechercher"
          title="Rechercher"
        >
          <Search className="h-4 w-4" aria-hidden />
        </Button>
      </form>

      {categories && categories.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-2xl border border-neutral-100 bg-neutral-0 p-2 shadow-soft">
          <button
            type="button"
            onClick={() => setCategoryFilter('')}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              !categoryId
                ? 'bg-primary-700 text-neutral-0'
                : 'text-neutral-700 hover:bg-neutral-50',
            )}
          >
            Tous ({totalDocuments})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={cn(
                'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                categoryId === cat.id
                  ? 'bg-primary-700 text-neutral-0'
                  : 'text-neutral-700 hover:bg-neutral-50',
              )}
            >
              {cat.name} ({cat.documentCount})
            </button>
          ))}
        </div>
      )}

      <section>
        {isLoading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <DashboardSkeleton key={i} className="h-52 rounded-2xl" />
            ))}
          </div>
        )}
        {!isLoading && data && data.data.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6">
            {data.data.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onDownload={() => downloadMutation.mutate(doc.id)}
                downloading={downloadMutation.isPending}
              />
            ))}
          </div>
        )}
        {data?.data.length === 0 && !isLoading && (
          <DashboardEmptyState
            message="Aucun document trouvé"
            description="Modifiez votre recherche ou vos filtres."
            icon={Library}
          />
        )}
      </section>

      {data && (
        <DashboardPagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          onPageChange={setPage}
        />
      )}

      {isAdmin && (
        <CreateDocumentSlideOver
          open={showCreate}
          onClose={() => setShowCreate(false)}
        />
      )}
    </DashboardPageShell>
  );
}
