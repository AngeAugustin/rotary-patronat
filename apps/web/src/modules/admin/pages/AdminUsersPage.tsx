import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ban, CircleCheck, Eye, Pencil, Trash2, Users } from 'lucide-react';
import {
  createUserSchema,
  editUserSchema,
  ROLE_LABELS,
  RoleCode,
  COMMISSION_POSTS,
  type CreateUserInput,
  type EditUserInput,
  type UserSummary,
} from '@rotary/shared-types';
import {
  fetchUsers,
  fetchUser,
  createUser,
  updateUser,
  deleteUser,
  fetchRoles,
  fetchCommissions,
  fetchMembers,
} from '../api';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { SlideOver } from '@/components/SlideOver';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  ResponsiveTable,
  dashboardTableClass,
  dashboardTableHeadClass,
  dashboardTableRowClass,
} from '@/components/ResponsiveTable';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  DashboardPagination,
  DashboardEmptyState,
  DashboardSkeleton,
} from '@/modules/dashboard/components/layout';
import { useCurrentUser } from '@/modules/auth/hooks/use-auth';
import { Link } from 'react-router-dom';
import { useAdminPageActions } from '../layouts/AdminLayout';
import { adminTabPath } from '../constants/admin-nav';

export function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [toggleTarget, setToggleTarget] = useState<UserSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserSummary | null>(null);
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const { setPageActions } = useAdminPageActions();

  useEffect(() => {
    setPageActions(
      <Button onClick={() => setShowForm(true)}>Nouvel utilisateur</Button>,
    );
    return () => setPageActions(null);
  }, [setPageActions]);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.users(page, query),
    queryFn: () => fetchUsers(page, query),
  });

  const { data: roles } = useQuery({
    queryKey: queryKeys.admin.roles,
    queryFn: fetchRoles,
  });

  const { data: commissions } = useQuery({
    queryKey: queryKeys.admin.commissions(1),
    queryFn: () => fetchCommissions(1),
  });

  const { data: availableMembers } = useQuery({
    queryKey: queryKeys.admin.members(1, undefined, true),
    queryFn: () => fetchMembers(1, undefined, true, 100),
    enabled: showForm,
  });

  const { data: editUser, isLoading: isEditLoading } = useQuery({
    queryKey: queryKeys.admin.user(editUserId ?? ''),
    queryFn: () => fetchUser(editUserId!),
    enabled: Boolean(editUserId),
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'members'] });
      setShowForm(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: EditUserInput }) =>
      updateUser(id, input),
    onSuccess: (updated, variables) => {
      queryClient.setQueryData(queryKeys.admin.user(variables.id), updated);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.user(variables.id) });
      setEditUserId(null);
      resetEditForm();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateUser(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setToggleTarget(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'members'] });
      setDeleteTarget(null);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      memberId: '',
      roles: [RoleCode.MEMBER],
      commissions: [{ commissionId: '', role: COMMISSION_POSTS[4] }],
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<EditUserInput>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      roles: [RoleCode.MEMBER],
      commissions: [{ commissionId: '', role: COMMISSION_POSTS[4] }],
    },
  });

  const selectedMemberId = watch('memberId');
  const selectedMember = availableMembers?.data.find((member) => member.id === selectedMemberId);

  const resetForm = () => {
    reset({
      memberId: '',
      roles: [RoleCode.MEMBER],
      commissions: [{ commissionId: '', role: COMMISSION_POSTS[4] }],
    });
  };

  const resetEditForm = () => {
    resetEdit({
      roles: [RoleCode.MEMBER],
      commissions: [{ commissionId: '', role: COMMISSION_POSTS[4] }],
    });
  };

  useEffect(() => {
    if (!editUser) return;
    resetEdit({
      roles: editUser.roles,
      commissions: [
        {
          commissionId: editUser.commissions[0]?.commissionId ?? '',
          role: editUser.commissions[0]?.role ?? COMMISSION_POSTS[4],
        },
      ],
    });
  }, [editUser, resetEdit]);

  const closeForm = () => {
    if (createMutation.isPending) return;
    setShowForm(false);
    resetForm();
  };

  const closeEditForm = () => {
    if (updateMutation.isPending) return;
    setEditUserId(null);
    resetEditForm();
  };

  const onSubmit = handleSubmit((values) => createMutation.mutate(values));
  const onEditSubmit = handleSubmitEdit((values) => {
    if (!editUserId) return;
    updateMutation.mutate({ id: editUserId, input: values });
  });

  const actionsDisabled =
    toggleMutation.isPending || deleteMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <form
        className="dashboard-toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(search);
          setPage(1);
        }}
      >
        <Input
          placeholder="Rechercher par nom ou e-mail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-0 bg-transparent shadow-none focus-visible:ring-0 sm:flex-1"
        />
        <Button type="submit" variant="outline" size="sm">
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
        <DashboardEmptyState
          message="Aucun utilisateur trouvé"
          description="Modifiez votre recherche ou créez un nouveau compte."
          icon={Users}
        />
      ) : (
        <ResponsiveTable>
          <table className={dashboardTableClass}>
            <thead className={dashboardTableHeadClass}>
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Rôles</th>
                <th className="px-4 py-3">Commissions</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((user) => (
                <tr key={user.id} className={dashboardTableRowClass}>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{user.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((r) => (
                        <Badge key={r}>{ROLE_LABELS[r]}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{user.commissionCount}</td>
                  <td className="px-4 py-3">
                    <Badge variant={user.isActive ? 'success' : 'danger'}>
                      {user.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {user.memberId && (
                        <Link
                          to={`${adminTabPath('membres')}/${user.memberId}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-primary-50 hover:text-primary-700"
                          aria-label={`Voir la fiche membre de ${user.firstName} ${user.lastName}`}
                          title="Voir la fiche membre"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden />
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => setEditUserId(user.id)}
                        disabled={actionsDisabled}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-primary-50 hover:text-primary-700 disabled:opacity-50"
                        aria-label={`Modifier le compte de ${user.firstName} ${user.lastName}`}
                        title="Modifier"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => setToggleTarget(user)}
                        disabled={actionsDisabled}
                        className={
                          user.isActive
                            ? 'inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50'
                            : 'inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50'
                        }
                        aria-label={
                          user.isActive
                            ? `Désactiver le compte de ${user.firstName} ${user.lastName}`
                            : `Activer le compte de ${user.firstName} ${user.lastName}`
                        }
                        title={user.isActive ? 'Désactiver' : 'Activer'}
                      >
                        {user.isActive ? (
                          <Ban className="h-3.5 w-3.5" aria-hidden />
                        ) : (
                          <CircleCheck className="h-3.5 w-3.5" aria-hidden />
                        )}
                      </button>
                      {currentUser?.id !== user.id && (
                        <button
                          type="button"
                          disabled={actionsDisabled}
                          onClick={() => setDeleteTarget(user)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          aria-label={`Supprimer le compte de ${user.firstName} ${user.lastName}`}
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      )}
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

      <SlideOver
        open={showForm}
        onClose={closeForm}
        eyebrow="Administration"
        title="Nouvel utilisateur"
        description="Créez un compte à partir d'un membre sans accès. Les identifiants seront envoyés par e-mail."
        closeDisabled={createMutation.isPending}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={closeForm}
              disabled={createMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              form="create-user-form"
              disabled={createMutation.isPending || !selectedMemberId}
            >
              {createMutation.isPending ? 'Création…' : 'Créer le compte'}
            </Button>
          </div>
        }
      >
        <form id="create-user-form" className="space-y-6" onSubmit={onSubmit}>
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-4 w-0.5 rounded-full bg-accent-500" aria-hidden />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-accent-700">
                Membre
              </h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="memberId">Sélectionner un membre</Label>
              <Select id="memberId" {...register('memberId')}>
                <option value="">Choisir un membre…</option>
                {availableMembers?.data.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName} — {member.email}
                  </option>
                ))}
              </Select>
              {errors.memberId && (
                <p className="text-sm text-red-600">{errors.memberId.message}</p>
              )}
              {availableMembers?.data.length === 0 && (
                <p className="text-sm text-neutral-500">
                  Aucun membre sans compte. Acceptez d&apos;abord une candidature d&apos;adhésion.
                </p>
              )}
            </div>

            {selectedMember && (
              <div className="rounded-xl border border-accent-200/70 bg-gradient-to-br from-accent-50/70 to-primary-50/30 p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-accent-700">
                  Identité reprise
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="displayFirstName">Prénom</Label>
                    <Input
                      id="displayFirstName"
                      value={selectedMember.firstName}
                      readOnly
                      className="border-accent-100/80 bg-neutral-0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="displayLastName">Nom</Label>
                    <Input
                      id="displayLastName"
                      value={selectedMember.lastName}
                      readOnly
                      className="border-accent-100/80 bg-neutral-0"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="displayEmail">E-mail</Label>
                    <Input
                      id="displayEmail"
                      type="email"
                      value={selectedMember.email}
                      readOnly
                      className="border-accent-100/80 bg-neutral-0"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-4 w-0.5 rounded-full bg-primary-500" aria-hidden />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                Rôles
              </h3>
            </div>
            <div className="flex flex-wrap gap-2 rounded-xl border border-primary-100/70 bg-primary-50/20 p-3.5">
              {roles?.map((role) => (
                <label
                  key={role.code}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-transparent bg-neutral-0 px-3 py-2 text-sm text-neutral-700 shadow-soft transition-colors has-[:checked]:border-accent-200 has-[:checked]:bg-accent-50 has-[:checked]:text-accent-800"
                >
                  <input
                    type="checkbox"
                    value={role.code}
                    {...register('roles')}
                    className="accent-accent-600"
                  />
                  {role.label}
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-4 w-0.5 rounded-full bg-accent-500" aria-hidden />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-accent-700">
                Commission
              </h3>
            </div>
            <div className="space-y-4 rounded-xl border border-accent-100/80 bg-accent-50/20 p-4">
              <div className="space-y-2">
                <Label htmlFor="commissionId">Commission</Label>
                <Select id="commissionId" {...register('commissions.0.commissionId')}>
                  <option value="">Sélectionner…</option>
                  {commissions?.data.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="commissionRole">Poste</Label>
                <Select id="commissionRole" {...register('commissions.0.role')}>
                  {COMMISSION_POSTS.map((post) => (
                    <option key={post} value={post}>
                      {post}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </section>

          {createMutation.isError && (
            <p className="rounded-xl border border-red-100 bg-red-50/60 px-3 py-2.5 text-sm text-red-600">
              {createMutation.error.message}
            </p>
          )}
        </form>
      </SlideOver>

      <SlideOver
        open={Boolean(editUserId)}
        onClose={closeEditForm}
        eyebrow="Administration"
        title="Modifier l'utilisateur"
        description="Mettez à jour les rôles et la commission. Les informations du membre restent inchangées."
        closeDisabled={updateMutation.isPending}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={closeEditForm}
              disabled={updateMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              form="edit-user-form"
              disabled={updateMutation.isPending || isEditLoading || !editUser}
            >
              {updateMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        }
      >
        {isEditLoading || !editUser ? (
          <div className="space-y-3">
            <DashboardSkeleton className="h-20 rounded-xl" />
            <DashboardSkeleton className="h-28 rounded-xl" />
            <DashboardSkeleton className="h-32 rounded-xl" />
          </div>
        ) : (
          <form id="edit-user-form" className="space-y-6" onSubmit={onEditSubmit}>
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-4 w-0.5 rounded-full bg-accent-500" aria-hidden />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-accent-700">
                  Membre
                </h3>
              </div>
              <div className="rounded-xl border border-accent-200/70 bg-gradient-to-br from-accent-50/70 to-primary-50/30 p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-accent-700">
                  Identité (non modifiable)
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="editDisplayFirstName">Prénom</Label>
                    <Input
                      id="editDisplayFirstName"
                      value={editUser.firstName}
                      readOnly
                      className="border-accent-100/80 bg-neutral-0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="editDisplayLastName">Nom</Label>
                    <Input
                      id="editDisplayLastName"
                      value={editUser.lastName}
                      readOnly
                      className="border-accent-100/80 bg-neutral-0"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="editDisplayEmail">E-mail</Label>
                    <Input
                      id="editDisplayEmail"
                      type="email"
                      value={editUser.email}
                      readOnly
                      className="border-accent-100/80 bg-neutral-0"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-4 w-0.5 rounded-full bg-primary-500" aria-hidden />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                  Rôles
                </h3>
              </div>
              <div className="flex flex-wrap gap-2 rounded-xl border border-primary-100/70 bg-primary-50/20 p-3.5">
                {roles?.map((role) => (
                  <label
                    key={role.code}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-transparent bg-neutral-0 px-3 py-2 text-sm text-neutral-700 shadow-soft transition-colors has-[:checked]:border-accent-200 has-[:checked]:bg-accent-50 has-[:checked]:text-accent-800"
                  >
                    <input
                      type="checkbox"
                      value={role.code}
                      {...registerEdit('roles')}
                      className="accent-accent-600"
                    />
                    {role.label}
                  </label>
                ))}
              </div>
              {editErrors.roles && (
                <p className="text-sm text-red-600">{editErrors.roles.message}</p>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-4 w-0.5 rounded-full bg-accent-500" aria-hidden />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-accent-700">
                  Commission
                </h3>
              </div>
              <div className="space-y-4 rounded-xl border border-accent-100/80 bg-accent-50/20 p-4">
                <div className="space-y-2">
                  <Label htmlFor="editCommissionId">Commission</Label>
                  <Select
                    id="editCommissionId"
                    {...registerEdit('commissions.0.commissionId')}
                  >
                    <option value="">Sélectionner…</option>
                    {commissions?.data.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                  {editErrors.commissions?.[0]?.commissionId && (
                    <p className="text-sm text-red-600">
                      {editErrors.commissions[0].commissionId.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editCommissionRole">Poste</Label>
                  <Select id="editCommissionRole" {...registerEdit('commissions.0.role')}>
                    {COMMISSION_POSTS.map((post) => (
                      <option key={post} value={post}>
                        {post}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </section>

            {updateMutation.isError && (
              <p className="rounded-xl border border-red-100 bg-red-50/60 px-3 py-2.5 text-sm text-red-600">
                {updateMutation.error.message}
              </p>
            )}
          </form>
        )}
      </SlideOver>

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onClose={() => setToggleTarget(null)}
        onConfirm={() =>
          toggleTarget &&
          toggleMutation.mutate({
            id: toggleTarget.id,
            isActive: !toggleTarget.isActive,
          })
        }
        title={
          toggleTarget?.isActive
            ? 'Désactiver ce compte utilisateur ?'
            : 'Activer ce compte utilisateur ?'
        }
        description={
          toggleTarget
            ? toggleTarget.isActive
              ? `Le compte de ${toggleTarget.firstName} ${toggleTarget.lastName} sera désactivé. L'utilisateur ne pourra plus se connecter à l'espace connecté.`
              : `Le compte de ${toggleTarget.firstName} ${toggleTarget.lastName} sera réactivé. L'utilisateur pourra à nouveau se connecter.`
            : undefined
        }
        confirmLabel={toggleTarget?.isActive ? 'Désactiver' : 'Activer'}
        cancelLabel="Annuler"
        confirmPending={toggleMutation.isPending}
        destructive={Boolean(toggleTarget?.isActive)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Supprimer ce compte utilisateur ?"
        description={
          deleteTarget
            ? `Le compte de ${deleteTarget.firstName} ${deleteTarget.lastName} (${deleteTarget.email}) sera définitivement supprimé. La fiche membre associée sera conservée.`
            : undefined
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        confirmPending={deleteMutation.isPending}
        destructive
      />
    </div>
  );
}
