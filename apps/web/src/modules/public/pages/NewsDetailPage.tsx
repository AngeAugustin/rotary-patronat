import { Link, useParams } from 'react-router-dom';
import { Share2 } from 'lucide-react';
import { useNewsArticle } from '../hooks/use-public-content';
import { PublicDetailLayout } from '../components/PublicDetailLayout';
import { Button } from '@/components/ui/button';
import { sanitizeHtml } from '@/lib/sanitize';
import { cn } from '@/lib/utils';
import { publicContainerClass } from '../constants/layout';

function formatDate(date: string | null) {
  if (!date) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function NewsDetailPage() {
  const { slug = '' } = useParams();
  const { data, isLoading, isError } = useNewsArticle(slug);

  const handleShare = async () => {
    if (navigator.share && data) {
      await navigator.share({
        title: data.title,
        text: data.excerpt,
        url: window.location.href,
      });
    }
  };

  if (isLoading) {
    return (
      <div className={cn(publicContainerClass, 'max-w-3xl py-16')}>
        <div className="h-4 w-36 animate-pulse rounded bg-neutral-100" />
        <div className="mt-6 h-8 w-3/4 animate-pulse rounded-lg bg-neutral-100" />
        <div className="mt-8 aspect-[16/9] animate-pulse rounded-2xl bg-neutral-100" />
        <div className="mt-8 space-y-3">
          <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-neutral-100" />
          <div className="h-4 w-4/6 animate-pulse rounded bg-neutral-100" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={cn(publicContainerClass, 'max-w-3xl py-20 text-center')}>
        <p className="text-neutral-700">Actualité introuvable.</p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/nos-actualites">Retour aux actualités</Link>
        </Button>
      </div>
    );
  }

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    <PublicDetailLayout
      backTo="/nos-actualites"
      backLabel="Retour aux actualités"
      title={data.title}
      coverImage={data.coverImage}
      badge={
        <span className="inline-flex rounded-md bg-accent-500/95 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-primary-950 backdrop-blur-sm">
          {data.category.name}
        </span>
      }
      meta={
        <div className="flex flex-wrap items-center gap-2">
          <time
            className="inline-flex items-center rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-primary-50 backdrop-blur-sm"
            dateTime={data.publishedAt ?? undefined}
          >
            {formatDate(data.publishedAt)}
          </time>
          {canShare && (
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-primary-50 backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <Share2 className="h-3.5 w-3.5" aria-hidden />
              Partager
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-8">
        <p className="border-l-2 border-primary-300 pl-4 text-base leading-relaxed text-neutral-700 sm:text-lg">
          {data.excerpt}
        </p>

        <div
          className={cn(
            'prose prose-neutral max-w-none text-neutral-700',
            'prose-headings:font-display prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-primary-900',
            'prose-p:text-[15px] prose-p:leading-relaxed sm:prose-p:text-base',
            'prose-a:font-medium prose-a:text-primary-700 prose-a:no-underline hover:prose-a:underline',
            'prose-img:rounded-xl prose-img:shadow-soft',
            'prose-blockquote:border-primary-200 prose-blockquote:text-neutral-600',
          )}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.content) }}
        />

        <div className="border-t border-neutral-100 pt-8">
          <Button asChild variant="outline" size="sm">
            <Link to="/nos-actualites">Voir toutes les actualités</Link>
          </Button>
        </div>
      </div>
    </PublicDetailLayout>
  );
}
