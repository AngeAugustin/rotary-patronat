import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useForm,
  type FieldErrors,
  type UseFormRegister,
  type UseFormRegisterReturn,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Trash2 } from 'lucide-react';
import {
  createCommissionSchema,
  type CommissionAdmin,
  type CreateCommissionInput,
} from '@rotary/shared-types';
import {
  fetchCommissions,
  createCommission,
  updateCommission,
  deleteCommission,
} from '../api';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SlideOver } from '@/components/SlideOver';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Link } from 'react-router-dom';
import {
  DashboardPagination,
  DashboardSkeleton,
} from '@/modules/dashboard/components/layout';
import { adminTabPath } from '../constants/admin-nav';
import { useAdminPageActions } from '../layouts/AdminLayout';

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const emptyDefaults: CreateCommissionInput = {
  name: '',
  slug: '',
  description: '',
  sortOrder: 0,
};

function CommissionFormFields({
  register,
  errors,
  slugRegister,
  onSlugChange,
  idPrefix,
}: {
  register: UseFormRegister<CreateCommissionInput>;
  errors: FieldErrors<CreateCommissionInput>;
  slugRegister: UseFormRegisterReturn;
  onSlugChange: () => void;
  idPrefix: string;
}) {
  return (
    <>
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="h-4 w-0.5 rounded-full bg-accent-500" aria-hidden />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-accent-700">
            Identité
          </h3>
        </div>
        <div className="space-y-4 rounded-xl border border-accent-100/80 bg-accent-50/20 p-4">
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-name`}>Nom</Label>
            <Input
              id={`${idPrefix}-name`}
              placeholder="Ex. Action sociale"
              {...register('name')}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-slug`}>Slug</Label>
            <Input
              id={`${idPrefix}-slug`}
              placeholder="ex: action-sociale"
              {...slugRegister}
              onChange={(event) => {
                onSlugChange();
                void slugRegister.onChange(event);
              }}
            />
            <p className="text-xs text-neutral-500">
              Généré automatiquement à partir du nom — vous pouvez le modifier.
            </p>
            {errors.slug && <p className="text-sm text-red-600">{errors.slug.message}</p>}
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
          <Label htmlFor={`${idPrefix}-description`}>Description</Label>
          <Textarea
            id={`${idPrefix}-description`}
            rows={4}
            placeholder="Mission et périmètre de la commission…"
            {...register('description')}
          />
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>
      </section>
    </>
  );
}

export function AdminCommissionsPage() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<CommissionAdmin | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CommissionAdmin | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [editSlugTouched, setEditSlugTouched] = useState(true);
  const queryClient = useQueryClient();
  const { setPageActions } = useAdminPageActions();

  useEffect(() => {
    setPageActions(
      <Button onClick={() => setShowForm(true)}>Nouvelle commission</Button>,
    );
    return () => setPageActions(null);
  }, [setPageActions]);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.commissions(page),
    queryFn: () => fetchCommissions(page),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateCommissionInput>({
    resolver: zodResolver(createCommissionSchema),
    defaultValues: emptyDefaults,
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setEditValue,
    watch: watchEdit,
    formState: { errors: editErrors },
  } = useForm<CreateCommissionInput>({
    resolver: zodResolver(createCommissionSchema),
    defaultValues: emptyDefaults,
  });

  const nameValue = watch('name');
  const editNameValue = watchEdit('name');

  useEffect(() => {
    if (!showForm || slugTouched) return;
    setValue('slug', slugify(nameValue ?? ''), { shouldValidate: Boolean(nameValue) });
  }, [nameValue, showForm, slugTouched, setValue]);

  useEffect(() => {
    if (!editTarget || editSlugTouched) return;
    setEditValue('slug', slugify(editNameValue ?? ''), {
      shouldValidate: Boolean(editNameValue),
    });
  }, [editNameValue, editTarget, editSlugTouched, setEditValue]);

  const createMutation = useMutation({
    mutationFn: createCommission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'commissions'] });
      setShowForm(false);
      reset(emptyDefaults);
      setSlugTouched(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateCommissionInput }) =>
      updateCommission(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'commissions'] });
      setEditTarget(null);
      resetEdit(emptyDefaults);
      setEditSlugTouched(true);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCommission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'commissions'] });
      setDeleteTarget(null);
    },
  });

  const closeForm = () => {
    if (createMutation.isPending) return;
    setShowForm(false);
    reset(emptyDefaults);
    setSlugTouched(false);
  };

  const openEdit = (commission: CommissionAdmin) => {
    setEditTarget(commission);
    setEditSlugTouched(true);
    resetEdit({
      name: commission.name,
      slug: commission.slug,
      description: commission.description,
      sortOrder: commission.sortOrder,
    });
  };

  const closeEditForm = () => {
    if (updateMutation.isPending) return;
    setEditTarget(null);
    resetEdit(emptyDefaults);
    setEditSlugTouched(true);
  };

  const onSubmit = handleSubmit((values) => createMutation.mutate(values));
  const onEditSubmit = handleSubmitEdit((values) => {
    if (!editTarget) return;
    updateMutation.mutate({ id: editTarget.id, input: values });
  });

  const slugRegister = register('slug');
  const editSlugRegister = registerEdit('slug');
  const actionsDisabled =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <DashboardSkeleton key={i} className="h-36" />
            ))
          : data?.data.map((commission) => (
              <article
                key={commission.id}
                className="group flex flex-col border border-neutral-200/80 bg-neutral-0 p-5 transition-colors hover:border-neutral-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-semibold tracking-tight text-primary-900">
                      <Link
                        to={`${adminTabPath('commissions')}/${commission.id}`}
                        className="transition-colors hover:text-accent-700"
                      >
                        {commission.name}
                      </Link>
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-neutral-500">
                      {commission.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 opacity-70 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => openEdit(commission)}
                      disabled={actionsDisabled}
                      className="inline-flex h-8 w-8 items-center justify-center text-neutral-400 transition-colors hover:text-primary-700 disabled:opacity-50"
                      aria-label={`Modifier ${commission.name}`}
                      title="Modifier"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(commission)}
                      disabled={actionsDisabled || commission.memberCount > 0}
                      className="inline-flex h-8 w-8 items-center justify-center text-neutral-400 transition-colors hover:text-red-600 disabled:opacity-50"
                      aria-label={
                        commission.memberCount > 0
                          ? `Impossible de supprimer ${commission.name} : des utilisateurs y sont associés`
                          : `Supprimer ${commission.name}`
                      }
                      title={
                        commission.memberCount > 0
                          ? 'Suppression impossible : utilisateurs associés'
                          : 'Supprimer'
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-1 flex-col justify-end gap-3 border-t border-neutral-100 pt-3">
                  <p className="text-xs text-neutral-500">
                    <span className="text-neutral-700">
                      {commission.memberCount} membre
                      {commission.memberCount > 1 ? 's' : ''}
                    </span>
                    <span className="mx-1.5 text-neutral-300" aria-hidden>
                      ·
                    </span>
                    <span>
                      {commission.leadUserName ?? (
                        <span className="text-neutral-400">Responsable non assigné</span>
                      )}
                    </span>
                  </p>
                  <Link
                    to={`${adminTabPath('commissions')}/${commission.id}`}
                    className="text-sm font-medium text-primary-700 transition-colors hover:text-accent-700"
                  >
                    Voir la fiche
                  </Link>
                </div>
              </article>
            ))}
      </div>

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
        title="Nouvelle commission"
        description="Créez une commission du club. Vous pourrez ensuite y affecter des membres et un responsable."
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
              form="create-commission-form"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Création…' : 'Créer la commission'}
            </Button>
          </div>
        }
      >
        <form id="create-commission-form" className="space-y-6" onSubmit={onSubmit}>
          <CommissionFormFields
            register={register}
            errors={errors}
            slugRegister={slugRegister}
            onSlugChange={() => setSlugTouched(true)}
            idPrefix="create"
          />
          {createMutation.isError && (
            <p className="rounded-xl border border-red-100 bg-red-50/60 px-3 py-2.5 text-sm text-red-600">
              {createMutation.error.message}
            </p>
          )}
        </form>
      </SlideOver>

      <SlideOver
        open={Boolean(editTarget)}
        onClose={closeEditForm}
        eyebrow="Administration"
        title="Modifier la commission"
        description="Mettez à jour le nom, le slug et la description de la commission."
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
              form="edit-commission-form"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        }
      >
        <form id="edit-commission-form" className="space-y-6" onSubmit={onEditSubmit}>
          <CommissionFormFields
            register={registerEdit}
            errors={editErrors}
            slugRegister={editSlugRegister}
            onSlugChange={() => setEditSlugTouched(true)}
            idPrefix="edit"
          />
          {updateMutation.isError && (
            <p className="rounded-xl border border-red-100 bg-red-50/60 px-3 py-2.5 text-sm text-red-600">
              {updateMutation.error.message}
            </p>
          )}
        </form>
      </SlideOver>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleteMutation.isPending && setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Supprimer cette commission ?"
        description={
          deleteTarget
            ? `La commission « ${deleteTarget.name} » sera définitivement supprimée. Cette action est irréversible.`
            : undefined
        }
        confirmLabel="Supprimer"
        confirmPending={deleteMutation.isPending}
        destructive
      />
    </div>
  );
}
