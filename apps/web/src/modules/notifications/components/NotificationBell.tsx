import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Bell, CheckCheck } from 'lucide-react';
import {
  fetchNotificationCounts,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api';
import { NotificationRow } from './NotificationRow';
import { queryKeys } from '@/lib/query-keys';
import { connectRealtime } from '@/lib/realtime-client';
import { cn } from '@/lib/utils';

const PREVIEW_LIMIT = 4;

function invalidateNotificationQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.notifications.counts });
  queryClient.invalidateQueries({ queryKey: queryKeys.notifications.lists });
}

function NotificationSkeleton() {
  return (
    <div className="space-y-1 px-4 py-3" aria-hidden>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3 py-2.5">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-neutral-100" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="h-3.5 w-3/4 animate-pulse rounded-md bg-neutral-100" />
            <div className="h-3 w-full animate-pulse rounded-md bg-neutral-50" />
            <div className="h-2.5 w-16 animate-pulse rounded-md bg-neutral-50" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyNotifications() {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 ring-1 ring-primary-100">
        <Bell className="h-5 w-5" aria-hidden />
      </span>
      <p className="mt-4 text-sm font-medium text-primary-900">Tout est à jour</p>
      <p className="mt-1 max-w-[14rem] text-xs leading-relaxed text-neutral-500">
        Les nouvelles notifications de votre club apparaîtront ici.
      </p>
    </div>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: counts } = useQuery({
    queryKey: queryKeys.notifications.counts,
    queryFn: fetchNotificationCounts,
    refetchInterval: 60_000,
  });

  const { data: notifications, isLoading } = useQuery({
    queryKey: queryKeys.notifications.list(1, PREVIEW_LIMIT),
    queryFn: () => fetchNotifications(1, PREVIEW_LIMIT),
    enabled: open,
  });

  useEffect(() => {
    const socket = connectRealtime();
    const onNotification = () => invalidateNotificationQueries(queryClient);
    socket.on('notification:new', onNotification);
    return () => {
      socket.off('notification:new', onNotification);
    };
  }, [queryClient]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleKey);
    }
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => invalidateNotificationQueries(queryClient),
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => invalidateNotificationQueries(queryClient),
  });

  const unread = counts?.unread ?? 0;
  const items = (notifications?.data ?? []).slice(0, PREVIEW_LIMIT);
  const total = notifications?.meta.total ?? items.length;
  const hasMore = total > PREVIEW_LIMIT;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread ? `, ${unread} non lues` : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          'relative flex h-10 w-10 items-center justify-center rounded-xl text-neutral-700 transition-colors',
          'hover:bg-neutral-50 hover:text-primary-700',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          open && 'bg-primary-50 text-primary-700',
        )}
      >
        <Bell className="h-[1.15rem] w-[1.15rem]" aria-hidden />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold leading-none text-white shadow-[0_0_0_2px_#fff]">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Notifications"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full z-50 mt-2 w-[min(22.5rem,calc(100vw-1.5rem))] origin-top-right overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-0 shadow-lift"
          >
            <div className="relative border-b border-neutral-100 bg-gradient-to-br from-primary-50/80 via-neutral-0 to-accent-50/40 px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary-900">Notifications</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {unread > 0
                      ? `${unread} non lue${unread > 1 ? 's' : ''}`
                      : 'Aucune non lue'}
                  </p>
                </div>
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllMutation.mutate()}
                    disabled={markAllMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-0/80 px-2.5 py-1.5 text-xs font-medium text-primary-700 shadow-soft ring-1 ring-neutral-100 transition hover:bg-neutral-0 hover:text-primary-900 disabled:opacity-60"
                  >
                    <CheckCheck className="h-3.5 w-3.5" aria-hidden />
                    Tout lire
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[min(22rem,60vh)] overflow-y-auto overscroll-contain">
              {isLoading && <NotificationSkeleton />}

              {!isLoading && items.length === 0 && <EmptyNotifications />}

              {!isLoading && items.length > 0 && (
                <div className="divide-y divide-neutral-50 py-1">
                  {items.map((n) => (
                    <NotificationRow
                      key={n.id}
                      notification={n}
                      compact
                      onRead={(id) => markReadMutation.mutate(id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {!isLoading && items.length > 0 && (
              <div className="border-t border-neutral-100 bg-neutral-50/60 p-2">
                <Link
                  to="/dashboard/notifications"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-neutral-0 hover:text-primary-900"
                >
                  Voir toutes les notifications
                  {hasMore && (
                    <span className="text-xs font-normal text-neutral-400">({total})</span>
                  )}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
