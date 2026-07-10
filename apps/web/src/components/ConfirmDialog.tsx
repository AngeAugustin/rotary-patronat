import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  error?: string | null;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmPending?: boolean;
  confirmDisabled?: boolean;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  error,
  children,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  confirmPending = false,
  confirmDisabled = false,
  destructive = false,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !confirmPending) onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose, confirmPending]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-primary-900/40 backdrop-blur-sm"
        aria-label="Fermer la fenêtre"
        onClick={confirmPending ? undefined : onClose}
        disabled={confirmPending}
      />

      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-2xl border border-neutral-100 bg-neutral-0 p-6 shadow-lift"
      >
        <h2 id={titleId} className="font-display text-lg font-semibold text-primary-900">
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className="mt-2 text-sm text-neutral-600">
            {description}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}
        {error && (
          <p className="mt-3 rounded-xl border border-red-100 bg-red-50/60 px-3 py-2.5 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={confirmPending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={confirmPending || confirmDisabled}
            className={cn(
              destructive &&
                'bg-red-600 text-neutral-0 hover:bg-red-700 focus-visible:outline-red-600',
            )}
          >
            {confirmPending ? 'En cours…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
