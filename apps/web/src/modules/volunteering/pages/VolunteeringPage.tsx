import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HeartHandshake } from 'lucide-react';
import {
  createVolunteeringSchema,
  type CreateVolunteeringInput,
  type VolunteeringSummary,
} from '@rotary/shared-types';
import {
  createVolunteering,
  deleteVolunteering,
  fetchVolunteering,
  fetchVolunteeringStats,
  updateVolunteering,
} from '../api';
import { DeclarationCard } from '../components/DeclarationCard';
import { queryKeys } from '@/lib/query-keys';
import { StatCard } from '@/modules/dashboard/components/StatCard';
import { SlideOver } from '@/components/SlideOver';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DashboardPageShell,
  DashboardPageHeader,
  DashboardSection,
  DashboardEmptyState,
  DashboardSkeleton,
} from '@/modules/dashboard/components/layout';

const DEFAULT_VALUES: CreateVolunteeringInput = {
  visitedClub: '',
  city: '',
  country: 'Bénin',
  activity: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  startTime: '09:00',
  durationMinutes: 120,
  hours: 2,
};

function toFormValues(declaration: VolunteeringSummary): CreateVolunteeringInput {
  return {
    visitedClub: declaration.visitedClub,
    city: declaration.city,
    country: declaration.country,
    activity: declaration.activity,
    description: declaration.description,
    date: declaration.date.slice(0, 10),
    startTime: declaration.startTime,
    durationMinutes: declaration.durationMinutes,
    hours: declaration.hours,
    proofUrl: declaration.proofUrl ?? undefined,
  };
}

function invalidateVolunteeringQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.volunteering.list });
  queryClient.invalidateQueries({ queryKey: queryKeys.volunteering.stats });
  queryClient.invalidateQueries({ queryKey: queryKeys.volunteering.admin });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.profile });
}

export function VolunteeringPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<VolunteeringSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VolunteeringSummary | null>(null);
  const queryClient = useQueryClient();
  const isEditing = Boolean(editing);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.volunteering.list,
    queryFn: () => fetchVolunteering(),
  });

  const { data: stats } = useQuery({
    queryKey: queryKeys.volunteering.stats,
    queryFn: fetchVolunteeringStats,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateVolunteeringInput>({
    resolver: zodResolver(createVolunteeringSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const resetForm = () => {
    reset({
      ...DEFAULT_VALUES,
      date: new Date().toISOString().slice(0, 10),
    });
  };

  const openCreateForm = () => {
    setEditing(null);
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (declaration: VolunteeringSummary) => {
    setEditing(declaration);
    reset(toFormValues(declaration));
    setShowForm(true);
  };

  const closeForm = () => {
    if (createMutation.isPending || updateMutation.isPending) return;
    setShowForm(false);
    setEditing(null);
    resetForm();
  };

  const createMutation = useMutation({
    mutationFn: createVolunteering,
    onSuccess: () => {
      invalidateVolunteeringQueries(queryClient);
      setShowForm(false);
      setEditing(null);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateVolunteeringInput }) =>
      updateVolunteering(id, input),
    onSuccess: () => {
      invalidateVolunteeringQueries(queryClient);
      setShowForm(false);
      setEditing(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVolunteering,
    onSuccess: () => {
      setDeleteTarget(null);
      invalidateVolunteeringQueries(queryClient);
    },
  });

  const formPending = createMutation.isPending || updateMutation.isPending;
  const formError = isEditing ? updateMutation.error : createMutation.error;
  const formHasError = isEditing ? updateMutation.isError : createMutation.isError;

  const onSubmit = handleSubmit((values) => {
    const payload = {
      ...values,
      date: new Date(`${values.date}T12:00:00`).toISOString(),
      proofUrl: values.proofUrl?.trim() || undefined,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, input: payload });
      return;
    }

    createMutation.mutate(payload);
  });

  return (
    <DashboardPageShell width="wide">
      <DashboardPageHeader
        eyebrow="Engagement"
        title="Bénévolat"
        description="Déclarez vos participations dans d'autres clubs Rotary."
        action={<Button onClick={openCreateForm}>Nouvelle déclaration</Button>}
      />

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Déclarations" value={stats.totalDeclarations} icon={HeartHandshake} />
          <StatCard label="Validées" value={stats.validatedCount} variant="primary" />
          <StatCard label="En attente" value={stats.pendingCount} variant="accent" />
          <StatCard label="Heures validées" value={`${stats.validatedHours} h`} />
        </div>
      )}

      <DashboardSection title="Historique">
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <DashboardSkeleton key={i} className="h-64" />
            ))}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.data.map((item) => (
            <DeclarationCard
              key={item.id}
              declaration={item}
              onEdit={item.status === 'PENDING' ? () => openEditForm(item) : undefined}
              onDelete={item.status === 'PENDING' ? () => setDeleteTarget(item) : undefined}
            />
          ))}
        </div>
        {data?.data.length === 0 && !isLoading && (
          <DashboardEmptyState
            message="Aucune déclaration pour le moment"
            description="Enregistrez votre première participation dans un club Rotary."
            icon={HeartHandshake}
            action={<Button onClick={openCreateForm}>Nouvelle déclaration</Button>}
          />
        )}
      </DashboardSection>

      <SlideOver
        open={showForm}
        onClose={closeForm}
        eyebrow="Bénévolat"
        title={isEditing ? 'Modifier la déclaration' : 'Nouvelle déclaration'}
        description={
          isEditing
            ? 'Mettez à jour votre déclaration en attente de validation.'
            : 'Déclarez une participation dans un autre club Rotary. Elle sera soumise à validation.'
        }
        closeDisabled={formPending}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={closeForm} disabled={formPending}>
              Annuler
            </Button>
            <Button type="submit" form="volunteering-form" disabled={formPending}>
              {formPending
                ? isEditing
                  ? 'Enregistrement…'
                  : 'Envoi…'
                : isEditing
                  ? 'Enregistrer'
                  : 'Soumettre'}
            </Button>
          </div>
        }
      >
        <form id="volunteering-form" className="space-y-6" onSubmit={onSubmit}>
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-4 w-0.5 rounded-full bg-accent-500" aria-hidden />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-accent-700">
                Lieu
              </h3>
            </div>
            <div className="space-y-4 rounded-xl border border-accent-100/80 bg-accent-50/20 p-4">
              <div className="space-y-2">
                <Label htmlFor="visitedClub">Club visité</Label>
                <Input
                  id="visitedClub"
                  placeholder="Ex. Rotary Club Cotonou"
                  {...register('visitedClub')}
                />
                {errors.visitedClub && (
                  <p className="text-sm text-red-600">{errors.visitedClub.message}</p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input id="city" placeholder="Cotonou" {...register('city')} />
                  {errors.city && <p className="text-sm text-red-600">{errors.city.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Input id="country" {...register('country')} />
                  {errors.country && (
                    <p className="text-sm text-red-600">{errors.country.message}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-4 w-0.5 rounded-full bg-primary-500" aria-hidden />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                Activité
              </h3>
            </div>
            <div className="space-y-4 rounded-xl border border-primary-100/70 bg-primary-50/20 p-4">
              <div className="space-y-2">
                <Label htmlFor="activity">Type d&apos;activité</Label>
                <Input
                  id="activity"
                  placeholder="Ex. Conférence, action sociale…"
                  {...register('activity')}
                />
                {errors.activity && (
                  <p className="text-sm text-red-600">{errors.activity.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="Décrivez brièvement votre participation…"
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-4 w-0.5 rounded-full bg-accent-500" aria-hidden />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-accent-700">
                Horaires
              </h3>
            </div>
            <div className="space-y-4 rounded-xl border border-accent-100/80 bg-accent-50/20 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" {...register('date')} />
                  {errors.date && <p className="text-sm text-red-600">{errors.date.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Heure de début</Label>
                  <Input id="startTime" type="time" {...register('startTime')} />
                  {errors.startTime && (
                    <p className="text-sm text-red-600">{errors.startTime.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="durationMinutes">Durée (minutes)</Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    min={15}
                    step={15}
                    {...register('durationMinutes', { valueAsNumber: true })}
                  />
                  {errors.durationMinutes && (
                    <p className="text-sm text-red-600">{errors.durationMinutes.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hours">Heures déclarées</Label>
                  <Input
                    id="hours"
                    type="number"
                    min={0.25}
                    step={0.25}
                    {...register('hours', { valueAsNumber: true })}
                  />
                  {errors.hours && <p className="text-sm text-red-600">{errors.hours.message}</p>}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-4 w-0.5 rounded-full bg-primary-500" aria-hidden />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                Preuve
              </h3>
            </div>
            <div className="space-y-2 rounded-xl border border-primary-100/70 bg-primary-50/20 p-4">
              <Label htmlFor="proofUrl">Lien de preuve (optionnel)</Label>
              <Input
                id="proofUrl"
                type="url"
                placeholder="https://…"
                {...register('proofUrl')}
              />
              {errors.proofUrl && (
                <p className="text-sm text-red-600">{errors.proofUrl.message}</p>
              )}
              <p className="text-xs text-neutral-500">
                Photo, attestation ou document partagé en ligne.
              </p>
            </div>
          </section>

          {formHasError && formError && (
            <p className="rounded-xl border border-red-100 bg-red-50/60 px-3 py-2.5 text-sm text-red-600">
              {formError.message}
            </p>
          )}
        </form>
      </SlideOver>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (deleteMutation.isPending) return;
          setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id);
        }}
        title="Supprimer cette déclaration ?"
        description={
          deleteTarget
            ? `La déclaration pour « ${deleteTarget.visitedClub} » (${deleteTarget.hours} h) sera définitivement supprimée.`
            : undefined
        }
        confirmLabel="Supprimer"
        destructive
        confirmPending={deleteMutation.isPending}
        error={deleteMutation.isError ? deleteMutation.error.message : null}
      />
    </DashboardPageShell>
  );
}
