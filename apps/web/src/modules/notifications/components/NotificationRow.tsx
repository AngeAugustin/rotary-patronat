import type { NotificationItem } from '@rotary/shared-types';
import { cn } from '@/lib/utils';
import {
  formatNotificationDateTime,
  formatRelativeNotificationDate,
  NOTIFICATION_TYPE_META,
} from '../notification-meta';

interface NotificationRowProps {
  notification: NotificationItem;
  onRead: (id: string) => void;
  /** denser padding for the header dropdown */
  compact?: boolean;
  /** show absolute datetime under relative time (page view) */
  showAbsoluteDate?: boolean;
}

export function NotificationRow({
  notification,
  onRead,
  compact = false,
  showAbsoluteDate = false,
}: NotificationRowProps) {
  const unread = !notification.readAt;
  const meta = NOTIFICATION_TYPE_META[notification.type] ?? NOTIFICATION_TYPE_META.SYSTEM;
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={() => unread && onRead(notification.id)}
      className={cn(
        'group flex w-full text-left transition-colors',
        compact ? 'gap-3 px-4 py-3.5' : 'gap-4 px-5 py-4 sm:px-6',
        unread ? 'bg-primary-50/35 hover:bg-primary-50/55' : 'hover:bg-neutral-50/80',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex shrink-0 items-center justify-center rounded-xl ring-1',
          compact ? 'h-10 w-10' : 'h-11 w-11',
          meta.iconClass,
          meta.ringClass,
        )}
      >
        <Icon className={cn(compact ? 'h-4 w-4' : 'h-[1.125rem] w-[1.125rem]')} aria-hidden />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span
            className={cn(
              'text-sm text-primary-900',
              compact ? 'line-clamp-1' : 'line-clamp-2',
              unread ? 'font-semibold' : 'font-medium',
            )}
          >
            {notification.title}
          </span>
          {unread && (
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-500"
              aria-label="Non lue"
            />
          )}
        </span>
        {notification.body && (
          <span
            className={cn(
              'mt-0.5 leading-relaxed text-neutral-600',
              compact ? 'line-clamp-2 text-xs' : 'line-clamp-3 text-sm',
            )}
          >
            {notification.body}
          </span>
        )}
        <span className="mt-1.5 block text-[11px] font-medium tracking-wide text-neutral-400">
          {formatRelativeNotificationDate(notification.createdAt)}
          {showAbsoluteDate && (
            <span className="text-neutral-400">
              {' · '}
              {formatNotificationDateTime(notification.createdAt)}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}
