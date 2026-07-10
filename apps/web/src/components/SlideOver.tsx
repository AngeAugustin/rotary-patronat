import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  closeDisabled?: boolean;
  size?: 'md' | 'lg';
}

const sizeClasses = {
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function SlideOver({
  open,
  onClose,
  title,
  description,
  eyebrow,
  children,
  footer,
  closeDisabled = false,
  size = 'lg',
}: SlideOverProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timer = window.setTimeout(() => panelRef.current?.focus(), 50);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !closeDisabled) onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, closeDisabled]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] h-dvh w-screen" role="presentation">
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 h-full w-full bg-primary-900/45 backdrop-blur-sm"
            aria-label="Fermer le panneau"
            onClick={closeDisabled ? undefined : onClose}
            disabled={closeDisabled}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'absolute right-0 top-0 flex h-dvh max-h-dvh w-full flex-col overflow-hidden border-l border-primary-100/80 bg-neutral-0 shadow-lift outline-none',
              sizeClasses[size],
            )}
          >
            <div
              className="h-1 shrink-0 bg-gradient-to-r from-primary-700 via-primary-500 to-accent-500"
              aria-hidden
            />

            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-primary-50 bg-gradient-to-br from-primary-50/80 via-neutral-0 to-accent-50/40 px-5 py-5 sm:px-6">
              <div className="min-w-0 pr-2">
                {eyebrow && (
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-700">
                    {eyebrow}
                  </p>
                )}
                <h2 id={titleId} className="font-display text-xl font-semibold tracking-tight text-primary-900">
                  {title}
                </h2>
                {description && (
                  <p id={descriptionId} className="mt-1.5 text-sm leading-relaxed text-neutral-500">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={closeDisabled}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary-100 bg-neutral-0 text-primary-600 transition-colors hover:border-accent-200 hover:bg-accent-50 hover:text-accent-700 disabled:opacity-50"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

            {footer && (
              <div className="shrink-0 border-t border-accent-100/60 bg-gradient-to-t from-accent-50/50 via-primary-50/30 to-neutral-0 px-5 py-4 sm:px-6">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
