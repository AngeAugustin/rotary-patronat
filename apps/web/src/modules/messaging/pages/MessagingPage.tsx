import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, RefreshCw, Send } from 'lucide-react';
import {
  createConversation,
  fetchConversation,
  fetchConversations,
  markConversationDelivered,
  markConversationRead,
  sendMessage,
} from '../api';
import { MessageReceiptTicks } from '../components/MessageReceiptTicks';
import { NewDirectConversationSlideOver } from '../components/NewDirectConversationSlideOver';
import { queryKeys } from '@/lib/query-keys';
import { connectRealtime } from '@/lib/realtime-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Message } from '@rotary/shared-types';
import {
  DashboardPageShell,
  DashboardPageHeader,
} from '@/modules/dashboard/components/layout';
import { useCurrentUser } from '@/modules/auth/hooks/use-auth';

function formatTime(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function directLabel(
  participants: { id: string; firstName: string; lastName: string }[],
  currentUserId?: string,
) {
  const others = currentUserId
    ? participants.filter((p) => p.id !== currentUserId)
    : participants;
  const list = others.length > 0 ? others : participants;
  return list.map((p) => `${p.firstName} ${p.lastName}`).join(', ');
}

export function MessagingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('c');
  const [draft, setDraft] = useState('');
  const [showNewDirect, setShowNewDirect] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();

  const POLL_MS = 15_000;

  const {
    data: conversations,
    isLoading: loadingList,
    refetch: refetchList,
  } = useQuery({
    queryKey: queryKeys.messaging.list,
    queryFn: () => fetchConversations(),
    refetchInterval: POLL_MS,
  });

  const {
    data: conversation,
    isLoading: loadingDetail,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: queryKeys.messaging.detail(selectedId ?? ''),
    queryFn: () => fetchConversation(selectedId!),
    enabled: !!selectedId,
    refetchInterval: selectedId ? POLL_MS : false,
  });

  const [manualRefresh, setManualRefresh] = useState(false);

  const handleRefresh = async () => {
    setManualRefresh(true);
    try {
      await refetchList();
      if (selectedId) {
        await refetchDetail();
        await markConversationRead(selectedId);
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.counts });
      }
    } finally {
      setManualRefresh(false);
    }
  };

  useEffect(() => {
    if (!selectedId) return;
    void markConversationRead(selectedId).then(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messaging.list });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.counts });
    });
  }, [selectedId, queryClient]);

  useEffect(() => {
    const socket = connectRealtime();
    if (selectedId) {
      socket.emit('conversation:join', { conversationId: selectedId });
    }

    const onMessage = (message: Message) => {
      // Accusé de réception dès que le client reçoit le message
      if (currentUser?.id && message.senderId !== currentUser.id) {
        void markConversationDelivered(message.conversationId);
      }

      if (message.conversationId === selectedId) {
        if (currentUser?.id && message.senderId !== currentUser.id) {
          void markConversationRead(selectedId).then(() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.messaging.list });
            queryClient.invalidateQueries({
              queryKey: queryKeys.notifications.counts,
            });
          });
        }
        queryClient.invalidateQueries({
          queryKey: queryKeys.messaging.detail(selectedId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.messaging.list });
    };

    const onReceipts = (payload: { conversationId: string }) => {
      if (payload.conversationId === selectedId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.messaging.detail(selectedId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.messaging.list });
    };

    socket.on('message:new', onMessage);
    socket.on('message:receipts', onReceipts);
    return () => {
      socket.off('message:new', onMessage);
      socket.off('message:receipts', onReceipts);
      if (selectedId) {
        socket.emit('conversation:leave', { conversationId: selectedId });
      }
    };
  }, [selectedId, queryClient, currentUser?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const sendMutation = useMutation({
    mutationFn: (content: string) => sendMessage(selectedId!, { content }),
    onSuccess: () => {
      setDraft('');
      queryClient.invalidateQueries({
        queryKey: queryKeys.messaging.detail(selectedId!),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.messaging.list });
    },
  });

  const createDirectMutation = useMutation({
    mutationFn: (participantId: string) =>
      createConversation({ type: 'DIRECT', participantIds: [participantId] }),
    onSuccess: (conv) => {
      setShowNewDirect(false);
      setSearchParams({ c: conv.id });
      queryClient.invalidateQueries({ queryKey: queryKeys.messaging.list });
    },
  });

  const showListOnMobile = !selectedId;
  const showChatOnMobile = !!selectedId;

  const conversationLabel =
    conversation?.type === 'GROUP'
      ? conversation.name
      : conversation
        ? directLabel(conversation.participants, currentUser?.id)
        : undefined;

  return (
    <DashboardPageShell width="full">
      <div className={cn(selectedId && 'hidden lg:block')}>
        <DashboardPageHeader
          eyebrow="Communication"
          title="Messagerie"
          description="Échanges privés entre membres du club."
        />
      </div>

      <div className="grid min-h-[calc(100dvh-12rem)] gap-4 lg:min-h-[60vh] lg:grid-cols-[300px_1fr]">
        <aside
          className={cn(
            'flex flex-col rounded-2xl border border-neutral-100 bg-neutral-0 shadow-soft',
            !showListOnMobile && 'hidden lg:flex',
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b border-neutral-100 px-4 py-3">
            <p className="text-sm font-medium text-neutral-700">Conversations</p>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => void handleRefresh()}
                disabled={manualRefresh}
                title="Actualiser (auto toutes les 15 s)"
                aria-label="Actualiser les messages"
              >
                <RefreshCw
                  className={cn('h-3.5 w-3.5', manualRefresh && 'animate-spin')}
                  aria-hidden
                />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 px-2.5"
                onClick={() => {
                  createDirectMutation.reset();
                  setShowNewDirect(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Nouveau
              </Button>
            </div>
          </div>
          <div className="max-h-[calc(100dvh-16rem)] flex-1 overflow-y-auto lg:max-h-[60vh]">
            {loadingList && (
              <p className="p-4 text-sm text-neutral-400">Chargement…</p>
            )}
            {conversations?.data.map((conv) => {
              const label =
                conv.type === 'GROUP'
                  ? conv.name
                  : directLabel(conv.participants, currentUser?.id);
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setSearchParams({ c: conv.id })}
                  className={cn(
                    'flex w-full flex-col gap-1 border-b border-neutral-50 px-4 py-3 text-left transition hover:bg-neutral-50',
                    selectedId === conv.id && 'bg-primary-50',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-primary-900">
                      {label}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="rounded-full bg-primary-600 px-2 py-0.5 text-xs text-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <span className="truncate text-xs text-neutral-500">
                      {conv.lastMessage.content}
                    </span>
                  )}
                </button>
              );
            })}
            {!loadingList && conversations?.data.length === 0 && (
              <div className="space-y-3 p-4 text-center">
                <p className="text-sm text-neutral-500">Aucune conversation.</p>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    createDirectMutation.reset();
                    setShowNewDirect(true);
                  }}
                >
                  Démarrer une conversation
                </Button>
              </div>
            )}
          </div>
        </aside>

        <section
          className={cn(
            'flex flex-col rounded-2xl border border-neutral-100 bg-neutral-0 shadow-soft',
            !showChatOnMobile && 'hidden lg:flex',
          )}
        >
          {!selectedId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
              <p className="max-w-sm text-sm text-neutral-500">
                Sélectionnez une conversation ou démarrez un échange privé avec un
                membre.
              </p>
              <Button
                type="button"
                onClick={() => {
                  createDirectMutation.reset();
                  setShowNewDirect(true);
                }}
              >
                <Plus className="h-4 w-4" aria-hidden />
                Nouvelle conversation
              </Button>
            </div>
          ) : loadingDetail ? (
            <div className="flex flex-1 items-center justify-center p-8 text-neutral-400">
              Chargement…
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3 sm:px-5 sm:py-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 shrink-0 p-0 lg:hidden"
                  onClick={() => setSearchParams({})}
                  aria-label="Retour aux conversations"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <p className="min-w-0 truncate font-medium text-primary-900">
                  {conversationLabel}
                </p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
                {conversation?.messages.map((msg) => {
                  const isMine = msg.senderId === currentUser?.id;
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'max-w-[85%] rounded-xl px-4 py-3',
                        isMine ? 'ml-auto bg-primary-50' : 'bg-neutral-50',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-primary-800">
                          {isMine ? 'Vous' : msg.senderName}
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs text-neutral-400">
                          {formatTime(msg.createdAt)}
                          {isMine && (
                            <MessageReceiptTicks status={msg.receiptStatus} />
                          )}
                        </span>
                      </div>
                      <p className="mt-1 break-words text-sm text-neutral-800">
                        {msg.content}
                      </p>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form
                className="flex gap-2 border-t border-neutral-100 p-3 sm:p-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (draft.trim()) sendMutation.mutate(draft.trim());
                }}
              >
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Écrire un message…"
                  className="min-w-0 flex-1"
                />
                <Button
                  type="submit"
                  disabled={sendMutation.isPending || !draft.trim()}
                  className="shrink-0"
                  aria-label="Envoyer"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </section>
      </div>

      <NewDirectConversationSlideOver
        open={showNewDirect}
        onClose={() => {
          setShowNewDirect(false);
          if (!createDirectMutation.isPending) {
            createDirectMutation.reset();
          }
        }}
        onSelect={(participantId) => createDirectMutation.mutateAsync(participantId)}
        isPending={createDirectMutation.isPending}
        errorMessage={createDirectMutation.error?.message}
      />
    </DashboardPageShell>
  );
}
