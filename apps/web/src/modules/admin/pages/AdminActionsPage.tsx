import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Eye, HandHeart, Pencil, Search, Trash2 } from 'lucide-react';
import {
  PUBLISH_STATUS_LABELS,
  type ActionAdmin,
  type CreateActionInput,
} from '@rotary/shared-types';
import {
  createAdminAction,
  deleteAdminAction,
  fetchAdminActions,
  updateAdminAction,
} from '../api';
import { ActionFormSlideOver } from '../components/ActionFormSlideOver';
import { queryKeys } from '@/lib/query-keys';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  ResponsiveTable,
  dashboardTableClass,
  dashboardTableHeadClass,
  dashboardTableRowClass,
} from '@/components/ResponsiveTable';
import {
  DashboardEmptyState,
  DashboardFilterBar,
  DashboardPagination,
  DashboardSkeleton,
} from '@/modules/dashboard/components/layout';
import { adminTabPath } from '../constants/admin-nav';
import { useAdminPageActions } from '../layouts/AdminLayout';
import { formatAdminDate, publishStatusBadgeClass } from '../utils/content';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = [
  { value: '', label: 'Tous' },
  ...(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const).map((value) => ({
    value,
    label: PUBLISH_STATUS_LABELS[value],
  })),
];

export function AdminActionsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<ActionAdmin | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ActionAdmin | null>(null);
  const queryClient = useQueryClient();
  const { setPageActions } = useAdminPageActions();

  const paramsKey = JSON.stringify({ page, status, search });

  useEffect(() => {
    setPageActions(
      <Button onClick={() => setShowForm(true)}>Nouvelle action</Button>,
    );
    return () => setPageActions(null);
  }, [setPageActions]);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.actions(paramsKey),
    queryFn: () =>
      fetchAdminActions({
        page,
        status: status || undefined,
        q: search || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: createAdminAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'actions'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateActionInput }) =>
      updateAdminAction(id, input),
    onSuccess: () => {
      setEditTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'actions'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'actions'] });
      setDeleteTarget(null);
    },
  });

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

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(q.trim());
          setPage(1);
        }}
      >
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Rechercher une action…"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          Rechercher
        </Button>
      </form>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <DashboardSkeleton key={i} className="h-14" />
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <DashboardEmptyState message="Aucune action pour ce filtre" icon={HandHeart} />
      ) : (
        <ResponsiveTable>
          <table className={dashboardTableClass}>
            <thead className={dashboardTableHeadClass}>
              <tr>
                <th className="px-4 py-3">Titre</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Lieu</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((action) => (
                <tr key={action.id} className={dashboardTableRowClass}>
                  <td className="px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-primary-900">{action.title}</p>
                      {action.featured && (
                        <p className="text-xs text-accent-700">À la une</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600">
                    {formatAdminDate(action.date)}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600">{action.location}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn(publishStatusBadgeClass(action.status))}>
                      {PUBLISH_STATUS_LABELS[action.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link to={adminTabPath(`actions/${action.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditTarget(action)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-700 hover:text-red-800"
                        onClick={() => setDeleteTarget(action)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

      <ActionFormSlideOver
        open={showForm}
        onClose={() => {
          setShowForm(false);
          if (!createMutation.isPending) {
            createMutation.reset();
          }
        }}
        onSubmit={(input) => createMutation.mutateAsync(input)}
        isPending={createMutation.isPending}
        errorMessage={createMutation.error?.message}
      />

      <ActionFormSlideOver
        open={Boolean(editTarget)}
        action={editTarget}
        onClose={() => {
          setEditTarget(null);
          if (!updateMutation.isPending) {
            updateMutation.reset();
          }
        }}
        onSubmit={(input) =>
          editTarget
            ? updateMutation.mutateAsync({ id: editTarget.id, input })
            : Promise.resolve()
        }
        isPending={updateMutation.isPending}
        errorMessage={updateMutation.error?.message}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!deleteMutation.isPending) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        title="Supprimer cette action ?"
        description={
          deleteTarget
            ? `L’action « ${deleteTarget.title} » sera définitivement supprimée.`
            : undefined
        }
        confirmLabel="Supprimer"
        confirmPending={deleteMutation.isPending}
        error={deleteMutation.error?.message}
        destructive
      />
    </div>
  );
}
