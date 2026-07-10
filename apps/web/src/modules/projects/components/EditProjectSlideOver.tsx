import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  createProjectSchema,
  type ProjectDetail,
  type UpdateProjectInput,
} from '@rotary/shared-types';
import { updateProject } from '../api';
import { fetchCommissions, fetchUsers } from '@/modules/admin/api';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { SlideOver } from '@/components/SlideOver';

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toDateInputValue(iso: string | null | undefined) {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}

const editProjectFormSchema = createProjectSchema
  .omit({ startDate: true, endDate: true, partners: true, beneficiaries: true, budgetSpent: true, status: true, progressPercent: true })
  .extend({
    startDate: z.string().min(1, 'Date de début requise'),
    endDate: z.string().optional(),
  });

type EditProjectFormValues = z.infer<typeof editProjectFormSchema>;

function toUpdateProjectInput(values: EditProjectFormValues): UpdateProjectInput {
  return {
    title: values.title,
    slug: values.slug,
    description: values.description,
    objectives: values.objectives || undefined,
    commissionId: values.commissionId,
    leadUserId: values.leadUserId,
    startDate: new Date(values.startDate).toISOString(),
    endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
    budgetPlanned: values.budgetPlanned,
  };
}

interface EditProjectSlideOverProps {
  open: boolean;
  onClose: () => void;
  project: ProjectDetail;
}

export function EditProjectSlideOver({
  open,
  onClose,
  project,
}: EditProjectSlideOverProps) {
  const queryClient = useQueryClient();
  const [slugTouched, setSlugTouched] = useState(true);

  const { data: commissions } = useQuery({
    queryKey: queryKeys.admin.commissions(1),
    queryFn: () => fetchCommissions(1),
    enabled: open,
  });

  const { data: users } = useQuery({
    queryKey: [...queryKeys.admin.users(1), 'project-edit-pool'],
    queryFn: () => fetchUsers(1, undefined, 50),
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditProjectFormValues>({
    resolver: zodResolver(editProjectFormSchema),
    defaultValues: {
      title: project.title,
      slug: project.slug,
      description: project.description,
      objectives: project.objectives ?? '',
      commissionId: project.commissionId,
      leadUserId: project.leadUserId,
      startDate: toDateInputValue(project.startDate),
      endDate: toDateInputValue(project.endDate),
      budgetPlanned: project.budgetPlanned,
    },
  });

  const titleValue = watch('title');
  const slugRegister = register('slug');

  useEffect(() => {
    if (!open) return;
    reset({
      title: project.title,
      slug: project.slug,
      description: project.description,
      objectives: project.objectives ?? '',
      commissionId: project.commissionId,
      leadUserId: project.leadUserId,
      startDate: toDateInputValue(project.startDate),
      endDate: toDateInputValue(project.endDate),
      budgetPlanned: project.budgetPlanned,
    });
    setSlugTouched(true);
  }, [open, project, reset]);

  useEffect(() => {
    if (!open || slugTouched) return;
    setValue('slug', slugify(titleValue ?? ''), {
      shouldValidate: Boolean(titleValue),
    });
  }, [titleValue, open, slugTouched, setValue]);

  const updateMutation = useMutation({
    mutationFn: (values: EditProjectFormValues) =>
      updateProject(project.id, toUpdateProjectInput(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'list'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(project.id) });
      onClose();
    },
  });

  const closeForm = () => {
    if (updateMutation.isPending) return;
    onClose();
  };

  const onSubmit = handleSubmit((values) => {
    updateMutation.mutate(values);
  });

  return (
    <SlideOver
      open={open}
      onClose={closeForm}
      eyebrow="Projets"
      title="Modifier le projet"
      description="Mise à jour possible uniquement tant que le projet est au statut « Prévu »."
      closeDisabled={updateMutation.isPending}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={closeForm}
            disabled={updateMutation.isPending}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            form="edit-project-form"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      }
    >
      <form id="edit-project-form" className="space-y-6" onSubmit={onSubmit}>
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-4 w-0.5 rounded-full bg-accent-500" aria-hidden />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-accent-700">
              Identité
            </h3>
          </div>
          <div className="space-y-4 rounded-xl border border-accent-100/80 bg-accent-50/20 p-4">
            <div className="space-y-2">
              <Label htmlFor="edit-project-title">Titre</Label>
              <Input
                id="edit-project-title"
                placeholder="Ex. Campagne de vaccination"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-project-slug">Slug</Label>
              <Input
                id="edit-project-slug"
                placeholder="ex: campagne-vaccination"
                {...slugRegister}
                onChange={(event) => {
                  setSlugTouched(true);
                  void slugRegister.onChange(event);
                }}
              />
              <p className="text-xs text-neutral-500">
                Identifiant d’URL — modifiable tant que le projet n’est pas démarré.
              </p>
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
          <div className="space-y-4 rounded-xl border border-primary-100/70 bg-primary-50/20 p-4">
            <div className="space-y-2">
              <Label htmlFor="edit-project-description">Description</Label>
              <Textarea
                id="edit-project-description"
                rows={3}
                placeholder="Contexte et périmètre du projet…"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-project-objectives">Objectifs</Label>
              <Textarea
                id="edit-project-objectives"
                rows={3}
                placeholder="Résultats attendus…"
                {...register('objectives')}
              />
              {errors.objectives && (
                <p className="text-sm text-red-600">{errors.objectives.message}</p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-4 w-0.5 rounded-full bg-primary-500" aria-hidden />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-primary-700">
              Organisation
            </h3>
          </div>
          <div className="space-y-4 rounded-xl border border-primary-100/70 bg-primary-50/20 p-4">
            <div className="space-y-2">
              <Label htmlFor="edit-project-commission">Commission</Label>
              <Select id="edit-project-commission" {...register('commissionId')}>
                <option value="">Sélectionner…</option>
                {commissions?.data.map((commission) => (
                  <option key={commission.id} value={commission.id}>
                    {commission.name}
                  </option>
                ))}
              </Select>
              {errors.commissionId && (
                <p className="text-sm text-red-600">{errors.commissionId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-project-lead">Responsable du projet</Label>
              <Select id="edit-project-lead" {...register('leadUserId')}>
                <option value="">Sélectionner…</option>
                {users?.data
                  .filter((user) => user.isActive)
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
              </Select>
              {errors.leadUserId && (
                <p className="text-sm text-red-600">{errors.leadUserId.message}</p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-4 w-0.5 rounded-full bg-accent-500" aria-hidden />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-accent-700">
              Planning & budget
            </h3>
          </div>
          <div className="space-y-4 rounded-xl border border-accent-100/80 bg-accent-50/20 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-project-start">Date de début</Label>
                <Input id="edit-project-start" type="date" {...register('startDate')} />
                {errors.startDate && (
                  <p className="text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-project-end">Date de fin</Label>
                <Input id="edit-project-end" type="date" {...register('endDate')} />
                {errors.endDate && (
                  <p className="text-sm text-red-600">{errors.endDate.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-project-budget">Budget prévisionnel (FCFA)</Label>
              <Input
                id="edit-project-budget"
                type="number"
                min={0}
                {...register('budgetPlanned', { valueAsNumber: true })}
              />
              {errors.budgetPlanned && (
                <p className="text-sm text-red-600">{errors.budgetPlanned.message}</p>
              )}
            </div>
          </div>
        </section>

        {updateMutation.isError && (
          <p className="rounded-xl border border-red-100 bg-red-50/60 px-3 py-2.5 text-sm text-red-600">
            {updateMutation.error.message}
          </p>
        )}
      </form>
    </SlideOver>
  );
}
