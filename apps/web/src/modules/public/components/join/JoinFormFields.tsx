import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface JoinFormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function JoinFormField({
  id,
  label,
  required,
  hint,
  error,
  children,
  className,
}: JoinFormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id} className="text-sm font-medium text-primary-900">
        {label}
        {required && (
          <span className="ml-1 text-accent-600" aria-hidden>
            *
          </span>
        )}
      </Label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-neutral-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface JoinFormSectionProps {
  step: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function JoinFormSection({
  step,
  title,
  description,
  children,
}: JoinFormSectionProps) {
  return (
    <section className="rounded-2xl border border-neutral-100 bg-neutral-50/60 p-6 md:p-7">
      <div className="mb-6 flex items-start gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-700 font-display text-sm font-bold text-neutral-0">
          {step}
        </span>
        <div>
          <h3 className="font-display text-lg font-semibold text-primary-900">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-neutral-500">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
