import * as React from 'react';
import { cn } from '@/lib/utils';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      'flex min-h-[88px] w-full rounded-xl border border-neutral-100 bg-neutral-0 px-4 py-3 text-sm text-neutral-900 shadow-soft transition-colors placeholder:text-neutral-400 focus-visible:border-primary-300 disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
