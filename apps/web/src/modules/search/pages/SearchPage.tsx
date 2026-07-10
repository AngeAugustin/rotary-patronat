import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { SEARCH_RESULT_TYPE_LABELS } from '@rotary/shared-types';
import { globalSearch } from '../api';
import { queryKeys } from '@/lib/query-keys';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DashboardPageShell,
  DashboardPageHeader,
  DashboardEmptyState,
  DashboardSkeleton,
} from '@/modules/dashboard/components/layout';

function formatDate(date: string | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.search.query(q),
    queryFn: () => globalSearch(q),
    enabled: q.length >= 2,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const query = String(form.get('q') ?? '').trim();
    if (query) setSearchParams({ q: query });
  };

  return (
    <DashboardPageShell width="narrow">
      <DashboardPageHeader
        eyebrow="Recherche"
        title="Recherche globale"
        description="Actualités, actions, documents, projets, publications et plus."
      />

      <form onSubmit={handleSubmit} className="dashboard-toolbar">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Que recherchez-vous ?"
          className="border-0 bg-transparent shadow-none focus-visible:ring-0 sm:flex-1"
        />
        <Button type="submit" size="sm">Rechercher</Button>
      </form>

      {q.length < 2 && (
        <p className="text-sm text-neutral-400">Saisissez au moins 2 caractères.</p>
      )}

      {(isLoading || isFetching) && q.length >= 2 && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <DashboardSkeleton key={i} className="h-24" />
          ))}
        </div>
      )}

      {data && (
        <section className="space-y-4">
          <p className="text-sm text-neutral-500">
            {data.results.length} résultat(s) pour « {data.query} »
          </p>
          {data.results.map((result) => (
            <Link
              key={`${result.type}-${result.id}`}
              to={result.url}
              className="block rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft transition-colors hover:border-primary-200 hover:shadow-lift"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display font-semibold text-primary-900">{result.title}</h3>
                <Badge>{SEARCH_RESULT_TYPE_LABELS[result.type]}</Badge>
              </div>
              {result.excerpt && (
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-neutral-700">
                  {result.excerpt}
                </p>
              )}
              <div className="mt-3 flex gap-3 text-xs text-neutral-400">
                {result.meta && <span>{result.meta}</span>}
                {formatDate(result.date) && <span>{formatDate(result.date)}</span>}
              </div>
            </Link>
          ))}
          {data.results.length === 0 && (
            <DashboardEmptyState
              message="Aucun résultat"
              description="Essayez avec d'autres mots-clés."
              icon={Search}
            />
          )}
        </section>
      )}
    </DashboardPageShell>
  );
}
