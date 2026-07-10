import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Eye, Trash2, UserPlus } from 'lucide-react';
import {
  MEMBERSHIP_APPLICATION_STATUS_LABELS,
  type MembershipApplicationSummary,
} from '@rotary/shared-types';
import { deleteMembershipApplication, fetchMembershipApplications } from '../api';
import { queryKeys } from '@/lib/query-keys';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  ResponsiveTable,
  dashboardTableClass,
  dashboardTableHeadClass,
  dashboardTableRowClass,
} from '@/components/ResponsiveTable';
import {
  DashboardFilterBar,
  DashboardPagination,
  DashboardEmptyState,
  DashboardSkeleton,
} from '@/modules/dashboard/components/layout';
import { adminTabPath } from '../constants/admin-nav';
import {
  applicationStatusBadgeVariant,
  formatApplicationDate,
} from '../components/membership/membership-application.utils';

const STATUS_FILTERS = [
  { value: '', label: 'Toutes' },
  ...(['PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED'] as const).map((value) => ({
    value,
    label: MEMBERSHIP_APPLICATION_STATUS_LABELS[value],
  })),
];

export function AdminMembershipPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('PENDING');
  const [deleteTarget, setDeleteTarget] = useState<MembershipApplicationSummary | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.membershipApplications(page, status || undefined),
    queryFn: () => fetchMembershipApplications(page, status || undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMembershipApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'membership'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'members'] });
      setDeleteTarget(null);
    },
  });

  const deleteDescription = deleteTarget
    ? deleteTarget.memberId
      ? `La candidature de ${deleteTarget.firstName} ${deleteTarget.lastName} sera supprimée. La fiche membre associée sera conservée.`
      : `La candidature de ${deleteTarget.firstName} ${deleteTarget.lastName} sera définitivement supprimée.`
    : undefined;

  return (
    <div className="space-y-6">
      <DashboardFilterBar
        options={STATUS_FILTERS}
        value={status}
        onChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <DashboardSkeleton key={i} className="h-14" />
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <DashboardEmptyState
          message="Aucune candidature pour ce filtre"
          icon={UserPlus}
        />
      ) : (
        <ResponsiveTable>
          <table className={dashboardTableClass}>
            <thead className={dashboardTableHeadClass}>
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Profession</th>
                <th className="px-4 py-3">Reçue le</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((app) => (
                <tr key={app.id} className={dashboardTableRowClass}>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {app.firstName} {app.lastName}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{app.email}</td>
                  <td className="px-4 py-3 text-neutral-700">{app.profession}</td>
                  <td className="px-4 py-3 text-neutral-700">
                    {formatApplicationDate(app.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={applicationStatusBadgeVariant[app.status]}>
                      {MEMBERSHIP_APPLICATION_STATUS_LABELS[app.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        to={`${adminTabPath('adhesions')}/${app.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-primary-50 hover:text-primary-700"
                        aria-label={`Voir la candidature de ${app.firstName} ${app.lastName}`}
                        title="Voir"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                      <button
                        type="button"
                        disabled={deleteMutation.isPending}
                        onClick={() => setDeleteTarget(app)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        aria-label={`Supprimer la candidature de ${app.firstName} ${app.lastName}`}
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTable>
      )}

      {data && (
        <DashboardPagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          onPageChange={setPage}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Supprimer cette candidature ?"
        description={deleteDescription}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        confirmPending={deleteMutation.isPending}
        destructive
      />
    </div>
  );
}
