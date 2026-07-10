import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: 'left' | 'right';
  className?: string;
}

export function MobileDrawer({
  open,
  onClose,
  title,
  children,
  side = 'left',
  className,
}: MobileDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] md:hidden" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-primary-900/40 backdrop-blur-sm"
        aria-label="Fermer le menu"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Menu de navigation'}
        className={cn(
          'absolute top-0 flex h-full w-[min(100vw-3rem,320px)] flex-col bg-neutral-0 shadow-lift',
          side === 'left' ? 'left-0 animate-slide-in-left' : 'right-0 animate-slide-in-right',
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-4">
          {title ? (
            <p className="font-display text-lg font-semibold text-primary-900">{title}</p>
          ) : (
            <span className="sr-only">Menu</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Fermer le menu"
            className="h-9 w-9 shrink-0 p-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
