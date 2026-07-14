import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Hash,
  Pencil,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  COMMISSION_POSTS,
  createCommissionSchema,
  type CreateCommissionInput,
} from '@rotary/shared-types';
import {
  fetchCommission,
  assignCommissionMember,
  removeCommissionMember,
  fetchUsers,
  updateCommission,
  deleteCommission,
} from '../api';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { SlideOver } from '@/components/SlideOver';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  ResponsiveTable,
  dashboardTableClass,
  dashboardTableHeadClass,
  dashboardTableRowClass,
} from '@/components/ResponsiveTable';
import { DashboardSkeleton } from '@/modules/dashboard/components/layout';
import { adminTabPath } from '../constants/admin-nav';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function InfoChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-neutral-100/80 bg-neutral-0/60 px-3 py-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">{label}</p>
        <p className="truncate text-sm font-medium text-primary-900">{value}</p>
      </div>
    </div>
  );
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function AdminCommissionDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<string>(COMMISSION_POSTS[4]);
  const [showEdit, setShowEdit] = useState(false);
  const [slugTouched, setSlugTouched] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [removeUserId, setRemoveUserId] = useState<string | null>(null);

  const { data: commission, isLoading } = useQuery({
    queryKey: queryKeys.admin.commission(id),
    queryFn: () => fetchCommission(id),
    enabled: Boolean(id),
  });

  const { data: users } = useQuery({
    queryKey: [...queryKeys.admin.users(1), 'assign-pool'],
    queryFn: () => fetchUsers(1, undefined, 50),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateCommissionInput>({
    resolver: zodResolver(createCommissionSchema),
  });

  const availableUsers = useMemo(() => {
    const assigned = new Set(commission?.members?.map((m) => m.userId) ?? []);
    return (users?.data ?? []).filter((u) => u.isActive && !assigned.has(u.id));
  }, [users, commission?.members]);

  const memberToRemove = commission?.members?.find((m) => m.userId === removeUserId);

  const openEdit = () => {
    if (!commission) return;
    setSlugTouched(true);
    reset({
      name: commission.name,
      slug: commission.slug,
      description: commission.description,
      sortOrder: commission.sortOrder,
    });
    setShowEdit(true);
  };

  const closeEdit = () => {
    if (updateMutation.isPending) return;
    setShowEdit(false);
  };

  const updateMutation = useMutation({
    mutationFn: (input: CreateCommissionInput) => updateCommission(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.commission(id) });
      queryClient.invalidateQueries({ queryKey: ['admin', 'commissions'] });
      setShowEdit(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCommission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'commissions'] });
      navigate(adminTabPath('commissions'));
    },
  });

  const assignMutation = useMutation({
    mutationFn: () => assignCommissionMember(id, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.commission(id) });
      queryClient.invalidateQueries({ queryKey: ['admin', 'commissions'] });
      setUserId('');
      setRole(COMMISSION_POSTS[4]);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberUserId: string) => removeCommissionMember(id, memberUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.commission(id) });
      queryClient.invalidateQueries({ queryKey: ['admin', 'commissions'] });
      setRemoveUserId(null);
    },
  });

  const slugRegister = register('slug');
  const nameRegister = register('name');
  const onEditSubmit = handleSubmit((values) => updateMutation.mutate(values));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <DashboardSkeleton className="h-5 w-36" />
        <DashboardSkeleton className="h-40 w-full rounded-2xl" />
        <DashboardSkeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!commission) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-neutral-700">Commission introuvable.</p>
        <Button asChild variant="outline">
          <Link to={adminTabPath('commissions')}>Retour aux commissions</Link>
        </Button>
      </div>
    );
  }

  const canDelete = commission.memberCount === 0;

  return (
    <div className="space-y-4">
      <Link
        to={adminTabPath('commissions')}
        className="group inline-flex items-center gap-2 text-sm font-medium text-neutral-400 transition-colors hover:text-primary-700"
      >
        <ArrowLeft
          className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
          aria-hidden
        />
        Retour aux commissions
      </Link>

      <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-0 shadow-soft">
        <div className="bg-gradient-to-br from-primary-50/90 via-neutral-0 to-neutral-0 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 ring-2 ring-primary-100">
                <Building2 className="h-6 w-6" aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-semibold tracking-tight text-primary-900 sm:text-2xl">
                    {commission.name}
                  </h2>
                  <Badge variant="default">{commission.slug}</Badge>
                </div>
                <p className="mt-1 text-sm text-neutral-600">
                  {commission.memberCount} membre
                  {commission.memberCount > 1 ? 's' : ''}
                  {commission.leadUserName
                    ? ` · Responsable : ${commission.leadUserName}`
                    : ' · Responsable non assigné'}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-neutral-0/80"
                onClick={openEdit}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Modifier
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-neutral-0/80 text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                disabled={!canDelete}
                title={
                  canDelete
                    ? 'Supprimer la commission'
                    : 'Retirez d’abord tous les membres'
                }
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Supprimer
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <InfoChip icon={Hash} label="Slug" value={commission.slug} />
            <InfoChip
              icon={Users}
              label="Membres"
              value={`${commission.memberCount} membre${commission.memberCount > 1 ? 's' : ''}`}
            />
            <InfoChip
              icon={UserPlus}
              label="Responsable"
              value={commission.leadUserName ?? 'Non assigné'}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
            <h3 className="font-display text-sm font-semibold text-primary-900">
              Présentation
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              {commission.description}
            </p>
          </section>

          <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary-600" aria-hidden />
              <h3 className="font-display text-sm font-semibold text-primary-900">
                Membres
                {commission.memberCount > 0 && (
                  <span className="ml-1.5 font-normal text-neutral-400">
                    ({commission.memberCount})
                  </span>
                )}
              </h3>
            </div>

            <ResponsiveTable>
              <table className={dashboardTableClass}>
                <thead className={dashboardTableHeadClass}>
                  <tr>
                    <th className="px-4 py-3">Membre</th>
                    <th className="px-4 py-3">E-mail</th>
                    <th className="px-4 py-3">Poste</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(!commission.members || commission.members.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-neutral-400">
                        Aucun membre assigné
                      </td>
                    </tr>
                  )}
                  {commission.members?.map((member) => (
                    <tr key={member.userId} className={dashboardTableRowClass}>
                      <td className="px-4 py-3 font-medium text-primary-900">
                        {member.firstName} {member.lastName}
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{member.email}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-lg bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-600">
                          {member.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => {
                            removeMutation.reset();
                            setRemoveUserId(member.userId);
                          }}
                          disabled={
                            removeMutation.isPending || member.canRemove === false
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          aria-label={
                            member.canRemove === false
                              ? `Impossible de retirer ${member.firstName} ${member.lastName} : c’est sa seule commission`
                              : `Retirer ${member.firstName} ${member.lastName}`
                          }
                          title={
                            member.canRemove === false
                              ? 'Impossible : ce membre n’a pas d’autre commission. Affectez-le d’abord à une autre commission.'
                              : 'Retirer'
                          }
                        >
                          <UserMinus className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ResponsiveTable>
          </section>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
            <div className="mb-3 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary-600" aria-hidden />
              <h3 className="font-display text-sm font-semibold text-primary-900">
                Ajouter un membre
              </h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assign-user">Utilisateur</Label>
                <Select
                  id="assign-user"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                >
                  <option value="">Sélectionner…</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </option>
                  ))}
                </Select>
                {availableUsers.length === 0 && (
                  <p className="text-xs text-neutral-500">
                    Tous les utilisateurs actifs sont déjà rattachés, ou aucun compte n’est
                    disponible.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="assign-role">Poste</Label>
                <Select
                  id="assign-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {COMMISSION_POSTS.map((post) => (
                    <option key={post} value={post}>
                      {post}
                    </option>
                  ))}
                </Select>
              </div>
              {assignMutation.isError && (
                <p className="rounded-xl border border-red-100 bg-red-50/60 px-3 py-2.5 text-sm text-red-600">
                  {assignMutation.error.message}
                </p>
              )}
              <Button
                type="button"
                className="w-full"
                onClick={() => assignMutation.mutate()}
                disabled={!userId || assignMutation.isPending}
              >
                {assignMutation.isPending ? 'Ajout…' : 'Ajouter à la commission'}
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
            <h3 className="mb-3 font-display text-sm font-semibold text-primary-900">
              Informations
            </h3>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">Ordre d’affichage</dt>
                <dd className="font-medium text-neutral-900">{commission.sortOrder}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-neutral-50 pt-3">
                <dt className="text-neutral-500">Identifiant</dt>
                <dd className="truncate font-mono text-xs text-neutral-600">{commission.id}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      <SlideOver
        open={showEdit}
        onClose={closeEdit}
        eyebrow="Administration"
        title="Modifier la commission"
        description="Mettez à jour le nom, le slug et la description de la commission."
        closeDisabled={updateMutation.isPending}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={closeEdit}
              disabled={updateMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              form="edit-commission-detail-form"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        }
      >
        <form
          id="edit-commission-detail-form"
          className="space-y-6"
          onSubmit={onEditSubmit}
        >
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-4 w-0.5 rounded-full bg-accent-500" aria-hidden />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-accent-700">
                Identité
              </h3>
            </div>
            <div className="space-y-4 rounded-xl border border-accent-100/80 bg-accent-50/20 p-4">
              <div className="space-y-2">
                <Label htmlFor="detail-edit-name">Nom</Label>
                <Input
                  id="detail-edit-name"
                  {...nameRegister}
                  onChange={(e) => {
                    void nameRegister.onChange(e);
                    if (!slugTouched) {
                      setValue('slug', slugify(e.target.value), {
                        shouldValidate: Boolean(e.target.value),
                      });
                    }
                  }}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="detail-edit-slug">Slug</Label>
                <Input
                  id="detail-edit-slug"
                  {...slugRegister}
                  onChange={(e) => {
                    setSlugTouched(true);
                    void slugRegister.onChange(e);
                  }}
                />
                {errors.slug && (
                  <p className="text-sm text-red-600">{errors.slug.message}</p>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-4 w-0.5 rounded-full bg-primary-500" aria-hidden />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                Présentation
              </h3>
            </div>
            <div className="space-y-2 rounded-xl border border-primary-100/70 bg-primary-50/20 p-4">
              <Label htmlFor="detail-edit-description">Description</Label>
              <Textarea id="detail-edit-description" rows={4} {...register('description')} />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </section>

          {updateMutation.isError && (
            <p className="rounded-xl border border-red-100 bg-red-50/60 px-3 py-2.5 text-sm text-red-600">
              {updateMutation.error.message}
            </p>
          )}
        </form>
      </SlideOver>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => {
          if (deleteMutation.isPending) return;
          setConfirmDelete(false);
          deleteMutation.reset();
        }}
        onConfirm={() => deleteMutation.mutate()}
        title="Supprimer cette commission ?"
        description={`La commission « ${commission.name} » sera définitivement supprimée. Cette action est irréversible.`}
        confirmLabel="Supprimer"
        confirmPending={deleteMutation.isPending}
        error={deleteMutation.isError ? deleteMutation.error.message : null}
        destructive
      />

      <ConfirmDialog
        open={Boolean(removeUserId)}
        onClose={() => {
          if (removeMutation.isPending) return;
          setRemoveUserId(null);
          removeMutation.reset();
        }}
        onConfirm={() => removeUserId && removeMutation.mutate(removeUserId)}
        title="Retirer ce membre ?"
        description={
          memberToRemove
            ? `${memberToRemove.firstName} ${memberToRemove.lastName} ne fera plus partie de la commission « ${commission.name} ».`
            : undefined
        }
        error={removeMutation.isError ? removeMutation.error.message : null}
        confirmLabel="Retirer"
        confirmPending={removeMutation.isPending}
        destructive
      />
    </div>
  );
}
