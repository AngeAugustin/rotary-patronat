import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { createProjectSchema, type CreateProjectInput } from '@rotary/shared-types';
import { createProject, createProjectTask } from '../api';
import { fetchCommissions, fetchUsers } from '@/modules/admin/api';
import { queryKeys } from '@/lib/query-keys';
import { useCurrentUser } from '@/modules/auth/hooks/use-auth';
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

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

const createProjectFormSchema = createProjectSchema
  .omit({ startDate: true, endDate: true, partners: true, beneficiaries: true, budgetSpent: true })
  .extend({
    startDate: z.string().min(1, 'Date de début requise'),
    endDate: z.string().optional(),
  });

type CreateProjectFormValues = z.infer<typeof createProjectFormSchema>;

function toCreateProjectInput(values: CreateProjectFormValues): CreateProjectInput {
  return createProjectSchema.parse({
    ...values,
    startDate: new Date(values.startDate).toISOString(),
    endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
    budgetSpent: 0,
    partners: [],
    beneficiaries: [],
  });
}

interface CreateProjectSlideOverProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (projectId: string) => void;
}

export function CreateProjectSlideOver({
  open,
  onClose,
  onCreated,
}: CreateProjectSlideOverProps) {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const [slugTouched, setSlugTouched] = useState(false);
  const [taskDraft, setTaskDraft] = useState('');
  const [tasks, setTasks] = useState<string[]>([]);

  const { data: commissions } = useQuery({
    queryKey: queryKeys.admin.commissions(1),
    queryFn: () => fetchCommissions(1),
    enabled: open,
  });

  const { data: users } = useQuery({
    queryKey: [...queryKeys.admin.users(1), 'project-create-pool'],
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
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectFormSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      objectives: '',
      commissionId: '',
      leadUserId: currentUser?.id ?? '',
      startDate: todayInputValue(),
      endDate: '',
      budgetPlanned: 0,
    },
  });

  const titleValue = watch('title');
  const slugRegister = register('slug');

  useEffect(() => {
    if (!open) return;
    reset({
      title: '',
      slug: '',
      description: '',
      objectives: '',
      commissionId: '',
      leadUserId: currentUser?.id ?? '',
      startDate: todayInputValue(),
      endDate: '',
      budgetPlanned: 0,
    });
    setSlugTouched(false);
    setTaskDraft('');
    setTasks([]);
  }, [open, currentUser?.id, reset]);

  useEffect(() => {
    if (!open || slugTouched) return;
    setValue('slug', slugify(titleValue ?? ''), {
      shouldValidate: Boolean(titleValue),
    });
  }, [titleValue, open, slugTouched, setValue]);

  const addTask = () => {
    const title = taskDraft.trim();
    if (!title) return;
    setTasks((prev) => [...prev, title]);
    setTaskDraft('');
  };

  const removeTask = (index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const createMutation = useMutation({
    mutationFn: async ({
      values,
      taskTitles,
    }: {
      values: CreateProjectFormValues;
      taskTitles: string[];
    }) => {
      const project = await createProject(toCreateProjectInput(values));
      for (const title of taskTitles) {
        await createProjectTask(project.id, { title });
      }
      return project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'list'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(project.id) });
      onClose();
      onCreated?.(project.id);
    },
  });

  const closeForm = () => {
    if (createMutation.isPending) return;
    onClose();
  };

  const onSubmit = handleSubmit((values) => {
    const pendingTask = taskDraft.trim();
    const taskTitles = pendingTask ? [...tasks, pendingTask] : tasks;
    createMutation.mutate({ values, taskTitles });
  });

  return (
    <SlideOver
      open={open}
      onClose={closeForm}
      eyebrow="Projets"
      title="Nouveau projet"
      description="Créez un projet rattaché à une commission et ajoutez éventuellement ses premières tâches."
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
            form="create-project-form"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Création…' : 'Créer le projet'}
          </Button>
        </div>
      }
    >
      <form id="create-project-form" className="space-y-6" onSubmit={onSubmit}>
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-4 w-0.5 rounded-full bg-accent-500" aria-hidden />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-accent-700">
              Identité
            </h3>
          </div>
          <div className="space-y-4 rounded-xl border border-accent-100/80 bg-accent-50/20 p-4">
            <div className="space-y-2">
              <Label htmlFor="create-project-title">Titre</Label>
              <Input
                id="create-project-title"
                placeholder="Ex. Campagne de vaccination"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-project-slug">Slug</Label>
              <Input
                id="create-project-slug"
                placeholder="ex: campagne-vaccination"
                {...slugRegister}
                onChange={(event) => {
                  setSlugTouched(true);
                  void slugRegister.onChange(event);
                }}
              />
              <p className="text-xs text-neutral-500">
                Généré automatiquement à partir du titre — vous pouvez le modifier.
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
              <Label htmlFor="create-project-description">Description</Label>
              <Textarea
                id="create-project-description"
                rows={3}
                placeholder="Contexte et périmètre du projet…"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-project-objectives">Objectifs</Label>
              <Textarea
                id="create-project-objectives"
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
              <Label htmlFor="create-project-commission">Commission</Label>
              <Select id="create-project-commission" {...register('commissionId')}>
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
              <Label htmlFor="create-project-lead">Responsable du projet</Label>
              <Select id="create-project-lead" {...register('leadUserId')}>
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
                <Label htmlFor="create-project-start">Date de début</Label>
                <Input id="create-project-start" type="date" {...register('startDate')} />
                {errors.startDate && (
                  <p className="text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-project-end">Date de fin</Label>
                <Input id="create-project-end" type="date" {...register('endDate')} />
                {errors.endDate && (
                  <p className="text-sm text-red-600">{errors.endDate.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-project-budget">Budget prévisionnel (FCFA)</Label>
              <Input
                id="create-project-budget"
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

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-4 w-0.5 rounded-full bg-primary-500" aria-hidden />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-primary-700">
              Tâches initiales
              {tasks.length > 0 && (
                <span className="ml-1.5 font-normal normal-case tracking-normal text-neutral-400">
                  ({tasks.length})
                </span>
              )}
            </h3>
          </div>
          <div className="space-y-3 rounded-xl border border-primary-100/70 bg-primary-50/20 p-4">
            <p className="text-xs leading-relaxed text-neutral-500">
              Optionnel — ajoutez dès maintenant les premières tâches du projet.
            </p>

            <div className="flex gap-2">
              <Input
                value={taskDraft}
                onChange={(e) => setTaskDraft(e.target.value)}
                placeholder="Ex. Préparer le plan de communication"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTask();
                  }
                }}
                disabled={createMutation.isPending}
              />
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                onClick={addTask}
                disabled={createMutation.isPending || !taskDraft.trim()}
              >
                <Plus className="h-4 w-4" aria-hidden />
                Ajouter
              </Button>
            </div>

            {tasks.length === 0 ? (
              <p className="text-sm text-neutral-500">Aucune tâche ajoutée pour le moment.</p>
            ) : (
              <ul className="space-y-2">
                {tasks.map((task, index) => (
                  <li
                    key={`${task}-${index}`}
                    className="flex items-center gap-2 rounded-xl border border-neutral-100 bg-neutral-0 px-3 py-2.5"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-[11px] font-semibold tabular-nums text-primary-700">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-primary-900">
                      {task}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeTask(index)}
                      disabled={createMutation.isPending}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      aria-label={`Retirer la tâche ${task}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {createMutation.isError && (
          <p className="rounded-xl border border-red-100 bg-red-50/60 px-3 py-2.5 text-sm text-red-600">
            {createMutation.error.message}
          </p>
        )}
      </form>
    </SlideOver>
  );
}
