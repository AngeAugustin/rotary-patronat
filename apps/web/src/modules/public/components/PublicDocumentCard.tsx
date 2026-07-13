import { Download, File, FileText, Image, Video } from 'lucide-react';
import {
  DOCUMENT_FILE_TYPE_LABELS,
  type DocumentFileType,
  type DocumentSummary,
} from '@rotary/shared-types';
import { cn } from '@/lib/utils';

const fileMeta: Record<
  DocumentFileType,
  { icon: typeof FileText; tone: string }
> = {
  PDF: {
    icon: FileText,
    tone: 'bg-primary-50 text-primary-700 ring-primary-100',
  },
  IMAGE: {
    icon: Image,
    tone: 'bg-accent-50 text-accent-800 ring-accent-100',
  },
  VIDEO: {
    icon: Video,
    tone: 'bg-primary-50 text-primary-600 ring-primary-100',
  },
  OTHER: {
    icon: File,
    tone: 'bg-neutral-100 text-neutral-600 ring-neutral-200/80',
  },
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function formatSize(bytes: number | null) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

interface PublicDocumentCardProps {
  document: DocumentSummary;
  className?: string;
}

export function PublicDocumentCard({
  document,
  className,
}: PublicDocumentCardProps) {
  const meta = fileMeta[document.fileType];
  const Icon = meta.icon;
  const sizeLabel = formatSize(document.fileSize);

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-xl border border-neutral-100/90 bg-neutral-0/90 transition-[border-color,background-color,box-shadow] duration-300 hover:border-primary-200 hover:bg-neutral-0 hover:shadow-soft',
        className,
      )}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-4">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1',
            meta.tone,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-800">
              {document.categoryName}
            </span>
            <span className="text-[11px] font-medium text-neutral-400">
              {DOCUMENT_FILE_TYPE_LABELS[document.fileType]}
            </span>
            {sizeLabel && (
              <>
                <span className="text-neutral-300" aria-hidden>
                  ·
                </span>
                <span className="text-[11px] text-neutral-400">{sizeLabel}</span>
              </>
            )}
          </div>

          <h3 className="mt-1.5 font-display text-[15px] font-semibold leading-snug tracking-tight text-primary-900 transition-colors group-hover:text-primary-700 sm:text-base">
            {document.title}
          </h3>

          {document.description && (
            <p className="mt-1 line-clamp-1 text-sm text-neutral-500 sm:line-clamp-2">
              {document.description}
            </p>
          )}

          <p className="mt-2 text-[11px] text-neutral-400">
            {formatDate(document.createdAt)}
            {document.downloadCount > 0 && (
              <>
                <span className="mx-1.5 text-neutral-300" aria-hidden>
                  ·
                </span>
                {document.downloadCount} téléchargement
                {document.downloadCount > 1 ? 's' : ''}
              </>
            )}
          </p>
        </div>

        <a
          href={document.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-neutral-200/80 bg-neutral-0 px-3.5 text-sm font-medium text-primary-800 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-900 sm:h-9"
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          Télécharger
        </a>
      </div>
    </article>
  );
}

export function PublicDocumentCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl border border-neutral-100 bg-neutral-0 p-4',
        className,
      )}
    >
      <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-neutral-100" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-28 animate-pulse rounded bg-neutral-100" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-100" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-100" />
      </div>
      <div className="hidden h-9 w-28 animate-pulse rounded-lg bg-neutral-100 sm:block" />
    </div>
  );
}
