import type { PublishStatus } from '@rotary/shared-types';

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function toDateInputValue(iso: string) {
  return iso.slice(0, 10);
}

export function fromDateInputValue(date: string) {
  return new Date(`${date}T12:00:00.000Z`).toISOString();
}

export function linesToList(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function listToLines(values: string[]) {
  return values.join('\n');
}

export function publishStatusBadgeClass(status: PublishStatus | string) {
  switch (status) {
    case 'PUBLISHED':
      return 'bg-emerald-50 text-emerald-800';
    case 'ARCHIVED':
      return 'bg-neutral-100 text-neutral-600';
    default:
      return 'bg-amber-50 text-amber-900';
  }
}

export function formatAdminDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}
