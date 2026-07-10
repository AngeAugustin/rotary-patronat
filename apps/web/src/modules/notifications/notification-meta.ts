import {
  AtSign,
  CalendarDays,
  Heart,
  HeartHandshake,
  MessageCircle,
  MessageSquare,
  Newspaper,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import type { NotificationType } from '@rotary/shared-types';

export const NOTIFICATION_TYPE_META: Record<
  NotificationType,
  { icon: LucideIcon; iconClass: string; ringClass: string }
> = {
  NEW_MESSAGE: {
    icon: MessageSquare,
    iconClass: 'bg-primary-50 text-primary-700',
    ringClass: 'ring-primary-100',
  },
  NEW_POST: {
    icon: Newspaper,
    iconClass: 'bg-primary-50 text-primary-700',
    ringClass: 'ring-primary-100',
  },
  POST_COMMENT: {
    icon: MessageCircle,
    iconClass: 'bg-accent-50 text-accent-700',
    ringClass: 'ring-accent-100',
  },
  POST_LIKE: {
    icon: Heart,
    iconClass: 'bg-red-50 text-red-600',
    ringClass: 'ring-red-100',
  },
  POST_MENTION: {
    icon: AtSign,
    iconClass: 'bg-primary-50 text-primary-700',
    ringClass: 'ring-primary-100',
  },
  VOLUNTEERING_VALIDATED: {
    icon: HeartHandshake,
    iconClass: 'bg-emerald-50 text-emerald-700',
    ringClass: 'ring-emerald-100',
  },
  VOLUNTEERING_REJECTED: {
    icon: HeartHandshake,
    iconClass: 'bg-red-50 text-red-600',
    ringClass: 'ring-red-100',
  },
  CALENDAR_INVITE: {
    icon: CalendarDays,
    iconClass: 'bg-accent-50 text-accent-700',
    ringClass: 'ring-accent-100',
  },
  SYSTEM: {
    icon: Sparkles,
    iconClass: 'bg-neutral-100 text-neutral-700',
    ringClass: 'ring-neutral-100',
  },
};

export function formatRelativeNotificationDate(date: string) {
  const then = new Date(date).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.round((now - then) / 1000));

  if (diffSec < 60) return "À l'instant";
  if (diffSec < 3600) {
    const m = Math.floor(diffSec / 60);
    return `Il y a ${m} min`;
  }
  if (diffSec < 86_400) {
    const h = Math.floor(diffSec / 3600);
    return `Il y a ${h} h`;
  }
  if (diffSec < 86_400 * 7) {
    const d = Math.floor(diffSec / 86_400);
    return `Il y a ${d} j`;
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatNotificationDateTime(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}
