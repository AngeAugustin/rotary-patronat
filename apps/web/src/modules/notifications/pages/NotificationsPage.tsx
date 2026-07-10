import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import {
  fetchNotificationCounts,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api';
import { NotificationRow } from '../components/NotificationRow';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import {
  DashboardEmptyState,
  DashboardPageHeader,
  DashboardPageShell,
  DashboardPagination,
  DashboardPanel,
  DashboardSkeleton,
} from '@/modules/dashboard/components/layout';

const PAGE_SIZE = 20;

function invalidateNotificationQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.notifications.counts });
  queryClient.invalidateQueries({ queryKey: queryKeys.notifications.lists });
}

export function NotificationsPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: counts } = useQuery({
    queryKey: queryKeys.notifications.counts,
    queryFn: fetchNotificationCounts,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.notifications.list(page, PAGE_SIZE),
    queryFn: () => fetchNotifications(page, PAGE_SIZE),
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => invalidateNotificationQueries(queryClient),
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => invalidateNotificationQueries(queryClient),
  });

  const unread = counts?.unread ?? 0;
  const items = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Espace membre"
        title="Notifications"
        description={
          unread > 0
            ? `Vous avez ${unread} notification${unread > 1 ? 's' : ''} non lue${unread > 1 ? 's' : ''}.`
            : 'Retrouvez l’historique de vos alertes et activités du club.'
        }
        action={
          unread > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
            >
              <CheckCheck className="h-4 w-4" aria-hidden />
              Tout marquer comme lu
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <DashboardPanel noPadding>
          <div className="space-y-0 divide-y divide-neutral-50 p-2" aria-hidden>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-4">
                <DashboardSkeleton className="h-11 w-11 shrink-0 rounded-xl" />
                <div className="flex-1 space-y-2 pt-1">
                  <DashboardSkeleton className="h-3.5 w-2/3" />
                  <DashboardSkeleton className="h-3 w-full" />
                  <DashboardSkeleton className="h-2.5 w-24" />
                </div>
              </div>
            ))}
          </div>
        </DashboardPanel>
      ) : items.length === 0 ? (
        <DashboardEmptyState
          icon={Bell}
          message="Aucune notification"
          description="Les nouvelles notifications de votre club apparaîtront ici."
        />
      ) : (
        <div className="space-y-4">
          <DashboardPanel
            noPadding
            title="Toutes les notifications"
            description={
              total > 0
                ? `${total} notification${total > 1 ? 's' : ''}${isFetching ? ' · Actualisation…' : ''}`
                : undefined
            }
          >
            <div className="divide-y divide-neutral-50">
              {items.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  showAbsoluteDate
                  onRead={(id) => markReadMutation.mutate(id)}
                />
              ))}
            </div>
          </DashboardPanel>

          <DashboardPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </DashboardPageShell>
  );
}
