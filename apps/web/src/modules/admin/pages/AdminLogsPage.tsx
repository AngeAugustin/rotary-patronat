import { Fragment, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  FileText,
  KeyRound,
  ScrollText,
  Shield,
  UserRound,
} from 'lucide-react';
import { fetchLogs } from '../api';
import { queryKeys } from '@/lib/query-keys';
import { UserAvatar } from '@/modules/dashboard/components/UserAvatar';
import {
  DashboardPagination,
  DashboardEmptyState,
  DashboardSkeleton,
} from '@/modules/dashboard/components/layout';
import { cn } from '@/lib/utils';

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function formatDay(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(date));
}

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Connexion',
  LOGOUT: 'Déconnexion',
  USER_CREATE: 'Création utilisateur',
  USER_UPDATE: 'Modification utilisateur',
  USER_DELETE: 'Suppression utilisateur',
  COMMISSION_CREATE: 'Création commission',
  COMMISSION_UPDATE: 'Modification commission',
  COMMISSION_DELETE: 'Suppression commission',
  COMMISSION_MEMBER_ASSIGN: 'Affectation commission',
  COMMISSION_MEMBER_REMOVE: 'Retrait commission',
  MEMBER_CREATE: 'Création membre',
  MEMBERSHIP_APPLICATION_CREATE: 'Candidature reçue',
  MEMBERSHIP_APPLICATION_DELETE: 'Candidature supprimée',
  DOCUMENT_CREATE: 'Document ajouté',
  DOCUMENT_DOWNLOAD: 'Téléchargement',
  PROJECT_CREATE: 'Création projet',
  PROJECT_UPDATE: 'Modification projet',
  MODERATION_POST_DELETE: 'Modération publication',
  MODERATION_COMMENT_DELETE: 'Modération commentaire',
  VOLUNTEERING_CREATE: 'Déclaration bénévolat',
};

const ACTION_FILTERS = [
  { value: '', label: 'Toutes' },
  { value: 'LOGIN', label: 'Connexions' },
  { value: 'LOGOUT', label: 'Déconnexions' },
  { value: 'USER_CREATE', label: 'Utilisateurs' },
  { value: 'COMMISSION_CREATE', label: 'Commissions' },
  { value: 'MEMBER_CREATE', label: 'Membres' },
];

type ActionTone = 'auth' | 'user' | 'commission' | 'moderation' | 'content' | 'default';

function getActionTone(action: string): ActionTone {
  if (action === 'LOGIN' || action === 'LOGOUT') return 'auth';
  if (action.startsWith('USER_') || action.startsWith('MEMBER')) return 'user';
  if (action.startsWith('COMMISSION_')) return 'commission';
  if (action.startsWith('MODERATION_')) return 'moderation';
  if (
    action.startsWith('DOCUMENT_') ||
    action.startsWith('PROJECT_') ||
    action.startsWith('POST_') ||
    action.startsWith('CALENDAR_')
  ) {
    return 'content';
  }
  return 'default';
}

const toneStyles: Record<
  ActionTone,
  { badge: string; icon: string; Icon: typeof KeyRound }
> = {
  auth: {
    badge: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
    icon: 'text-emerald-600',
    Icon: KeyRound,
  },
  user: {
    badge: 'bg-primary-50 text-primary-800 ring-primary-100',
    icon: 'text-primary-600',
    Icon: UserRound,
  },
  commission: {
    badge: 'bg-accent-50 text-accent-900 ring-accent-100',
    icon: 'text-accent-700',
    Icon: Building2,
  },
  moderation: {
    badge: 'bg-red-50 text-red-800 ring-red-100',
    icon: 'text-red-600',
    Icon: Shield,
  },
  content: {
    badge: 'bg-neutral-100 text-neutral-800 ring-neutral-200',
    icon: 'text-neutral-600',
    Icon: FileText,
  },
  default: {
    badge: 'bg-neutral-50 text-neutral-700 ring-neutral-100',
    icon: 'text-neutral-500',
    Icon: ScrollText,
  },
};

function actionLabel(action: string) {
  return ACTION_LABELS[action] ?? action.replaceAll('_', ' ').toLowerCase();
}

export function AdminLogsPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.logs(page, action || undefined),
    queryFn: () => fetchLogs(page, action || undefined),
  });

  let lastDayKey = '';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-neutral-100 pb-4">
        {ACTION_FILTERS.map((filter) => {
          const isActive = action === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => {
                setAction(filter.value);
                setPage(1);
              }}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm transition-colors',
                isActive
                  ? 'bg-primary-900 text-neutral-0'
                  : 'text-neutral-500 hover:bg-neutral-50 hover:text-primary-800',
              )}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <DashboardSkeleton key={i} className="h-14" />
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <DashboardEmptyState
          message="Aucune activité enregistrée"
          description="Les actions sensibles apparaîtront ici."
          icon={ScrollText}
        />
      ) : (
        <div className="overflow-hidden border border-neutral-200/80 bg-neutral-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400">
                    Activité
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400">
                    Auteur
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400">
                    Ressource
                  </th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400">
                    Horodatage
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((log) => {
                  const tone = getActionTone(log.action);
                  const { badge, icon, Icon } = toneStyles[tone];
                  const dayKey = new Date(log.createdAt).toDateString();
                  const showDay = dayKey !== lastDayKey;
                  lastDayKey = dayKey;

                  return (
                    <Fragment key={log.id}>
                      {showDay && (
                        <tr className="bg-neutral-50/70">
                          <td
                            colSpan={4}
                            className="px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-neutral-400"
                          >
                            {formatDay(log.createdAt)}
                          </td>
                        </tr>
                      )}
                      <tr className="border-b border-neutral-50 transition-colors last:border-0 hover:bg-primary-50/30">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-0 ring-1',
                                icon,
                                tone === 'auth' && 'ring-emerald-100',
                                tone === 'user' && 'ring-primary-100',
                                tone === 'commission' && 'ring-accent-100',
                                tone === 'moderation' && 'ring-red-100',
                                (tone === 'content' || tone === 'default') &&
                                  'ring-neutral-100',
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" aria-hidden />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-primary-900">
                                {actionLabel(log.action)}
                              </p>
                              <span
                                className={cn(
                                  'mt-1 inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
                                  badge,
                                )}
                              >
                                {log.action}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {log.user ? (
                            <div className="flex items-center gap-2.5">
                              <UserAvatar
                                firstName={log.user.firstName}
                                lastName={log.user.lastName}
                                size="sm"
                                className="h-8 w-8 rounded-lg text-[10px] ring-1 ring-neutral-100"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-neutral-900">
                                  {log.user.firstName} {log.user.lastName}
                                </p>
                                <p className="truncate text-xs text-neutral-400">
                                  {log.user.email}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-neutral-400">Système</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {log.resource ? (
                            <div className="min-w-0">
                              <p className="text-sm text-neutral-700">{log.resource}</p>
                              {log.resourceId && (
                                <p className="mt-0.5 truncate font-mono text-[11px] text-neutral-400">
                                  {log.resourceId.slice(0, 8)}…
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-neutral-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <time
                            dateTime={log.createdAt}
                            className="whitespace-nowrap text-sm tabular-nums text-neutral-500"
                          >
                            {formatDate(log.createdAt)}
                          </time>
                          {log.ipAddress && (
                            <p className="mt-0.5 font-mono text-[11px] text-neutral-300">
                              {log.ipAddress}
                            </p>
                          )}
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data && (
        <DashboardPagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
