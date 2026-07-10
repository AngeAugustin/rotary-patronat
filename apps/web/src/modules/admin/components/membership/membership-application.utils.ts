import type { MembershipApplicationStatus } from '@rotary/shared-types';

export function formatApplicationDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatApplicationDateShort(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export const applicationStatusBadgeVariant: Record<
  MembershipApplicationStatus,
  'warning' | 'default' | 'success' | 'danger'
> = {
  PENDING: 'warning',
  REVIEWED: 'default',
  ACCEPTED: 'success',
  REJECTED: 'danger',
};

export const applicationStatusAccent: Record<MembershipApplicationStatus, string> = {
  PENDING: 'from-accent-400 to-accent-500',
  REVIEWED: 'from-primary-400 to-primary-600',
  ACCEPTED: 'from-emerald-400 to-emerald-600',
  REJECTED: 'from-red-400 to-red-500',
};

export const applicationStatusRing: Record<MembershipApplicationStatus, string> = {
  PENDING: 'ring-accent-200',
  REVIEWED: 'ring-primary-200',
  ACCEPTED: 'ring-emerald-200',
  REJECTED: 'ring-red-200',
};
