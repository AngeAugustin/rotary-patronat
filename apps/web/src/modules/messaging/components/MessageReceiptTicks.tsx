import { Check, CheckCheck } from 'lucide-react';
import type { MessageReceiptStatus } from '@rotary/shared-types';
import { cn } from '@/lib/utils';

interface MessageReceiptTicksProps {
  status: MessageReceiptStatus | null | undefined;
  className?: string;
}

export function MessageReceiptTicks({ status, className }: MessageReceiptTicksProps) {
  if (!status) return null;

  const isRead = status === 'READ';
  const isDeliveredOrRead = status === 'DELIVERED' || status === 'READ';

  return (
    <span
      className={cn('inline-flex items-center', className)}
      title={
        status === 'SENT'
          ? 'Envoyé'
          : status === 'DELIVERED'
            ? 'Reçu'
            : 'Lu'
      }
      aria-label={
        status === 'SENT'
          ? 'Message envoyé'
          : status === 'DELIVERED'
            ? 'Message reçu'
            : 'Message lu'
      }
    >
      {isDeliveredOrRead ? (
        <CheckCheck
          className={cn('h-3.5 w-3.5', isRead ? 'text-sky-500' : 'text-neutral-400')}
          aria-hidden
        />
      ) : (
        <Check className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
      )}
    </span>
  );
}
