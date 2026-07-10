import { FileText, Image, Video, File } from 'lucide-react';
import { DOCUMENT_FILE_TYPE_LABELS, type DocumentSummary } from '@rotary/shared-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const icons = {
  PDF: FileText,
  IMAGE: Image,
  VIDEO: Video,
  OTHER: File,
};

interface DocumentCardProps {
  document: DocumentSummary;
  onDownload?: () => void;
  downloading?: boolean;
  className?: string;
}

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

export function DocumentCard({
  document,
  onDownload,
  downloading,
  className,
}: DocumentCardProps) {
  const Icon = icons[document.fileType];
  const sizeLabel = formatSize(document.fileSize);

  return (
    <article
      className={cn(
        'flex h-full flex-col rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <Badge className="shrink-0">{DOCUMENT_FILE_TYPE_LABELS[document.fileType]}</Badge>
      </div>

      <div className="mt-4 min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
          {document.categoryName}
        </p>
        <h3 className="mt-1.5 line-clamp-2 font-display text-base font-semibold leading-snug tracking-tight text-primary-900">
          {document.title}
        </h3>
        {document.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-neutral-500">
            {document.description}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 border-t border-neutral-100 pt-3 text-xs text-neutral-400">
        <span className="truncate">{document.uploadedByName}</span>
        <span>{formatDate(document.createdAt)}</span>
        {sizeLabel && <span>{sizeLabel}</span>}
        <span>
          {document.downloadCount} téléchargement
          {document.downloadCount > 1 ? 's' : ''}
        </span>
      </div>

      <div className="mt-4">
        <Button
          size="sm"
          className="w-full"
          disabled={downloading}
          onClick={() => {
            onDownload?.();
            window.open(document.fileUrl, '_blank', 'noopener,noreferrer');
          }}
        >
          Télécharger
        </Button>
      </div>
    </article>
  );
}
