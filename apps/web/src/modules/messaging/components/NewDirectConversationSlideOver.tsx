import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import type { MessagingRecipient } from '@rotary/shared-types';
import { fetchMessagingRecipients } from '../api';
import { queryKeys } from '@/lib/query-keys';
import { SlideOver } from '@/components/SlideOver';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/modules/dashboard/components/UserAvatar';
import { cn } from '@/lib/utils';

interface NewDirectConversationSlideOverProps {
  open: boolean;
  onClose: () => void;
  onSelect: (recipientId: string) => Promise<unknown>;
  isPending?: boolean;
  errorMessage?: string | null;
}

export function NewDirectConversationSlideOver({
  open,
  onClose,
  onSelect,
  isPending = false,
  errorMessage,
}: NewDirectConversationSlideOverProps) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setDebounced('');
    setSelectedId(null);
  }, [open]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const { data: recipients = [], isLoading, isFetching } = useQuery({
    queryKey: queryKeys.messaging.recipients(debounced),
    queryFn: () => fetchMessagingRecipients(debounced || undefined),
    enabled: open,
  });

  const selectMutation = useMutation({
    mutationFn: (recipientId: string) => onSelect(recipientId),
  });

  const busy = isPending || selectMutation.isPending;
  const displayError = errorMessage ?? selectMutation.error?.message;

  const closePanel = () => {
    if (busy) return;
    onClose();
  };

  const startConversation = async (recipient: MessagingRecipient) => {
    setSelectedId(recipient.id);
    await selectMutation.mutateAsync(recipient.id);
  };

  return (
    <SlideOver
      open={open}
      onClose={closePanel}
      size="md"
      eyebrow="Messagerie"
      title="Nouvelle conversation"
      description="Choisissez un membre pour démarrer un échange privé."
      closeDisabled={busy}
      footer={
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={closePanel} disabled={busy}>
            Annuler
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un membre…"
            className="pl-9"
            aria-label="Rechercher un membre"
            disabled={busy}
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
            Membres
            {isFetching && !isLoading ? ' · recherche…' : null}
          </p>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-xl border border-neutral-100 bg-neutral-50"
                />
              ))}
            </div>
          ) : recipients.length === 0 ? (
            <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/60 px-3.5 py-6 text-center text-sm text-neutral-500">
              {debounced
                ? 'Aucun membre ne correspond à cette recherche.'
                : 'Aucun autre membre disponible.'}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {recipients.map((recipient) => {
                const isSelected = selectedId === recipient.id && busy;
                return (
                  <li key={recipient.id}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void startConversation(recipient)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-0 px-3 py-2.5 text-left transition-colors',
                        'hover:border-primary-200 hover:bg-primary-50/40',
                        'disabled:cursor-not-allowed disabled:opacity-60',
                        isSelected && 'border-primary-200 bg-primary-50/60',
                      )}
                    >
                      <UserAvatar
                        firstName={recipient.firstName}
                        lastName={recipient.lastName}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-primary-900">
                          {recipient.firstName} {recipient.lastName}
                        </span>
                        {recipient.email && (
                          <span className="block truncate text-xs text-neutral-500">
                            {recipient.email}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs font-medium text-primary-600">
                        {isSelected ? 'Ouverture…' : 'Écrire'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {displayError && (
          <p className="rounded-xl border border-red-100 bg-red-50/60 px-3 py-2.5 text-sm text-red-600">
            {displayError}
          </p>
        )}
      </div>
    </SlideOver>
  );
}
