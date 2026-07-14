import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  CircleDollarSign,
  FolderKanban,
  HandHeart,
  Pause,
  Pencil,
  Play,
  Target,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_TASK_STATUS_LABELS,
  ProjectStatus,
  ProjectTaskStatus,
  RoleCode,
} from '@rotary/shared-types';
import {
  fetchProject,
  createProjectTask,
  deleteProject,
  updateProject,
  updateProjectTask,
} from '../api';
import { EditProjectSlideOver } from '../components/EditProjectSlideOver';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DashboardSkeleton } from '@/modules/dashboard/components/layout';
import { UserAvatar } from '@/modules/dashboard/components/UserAvatar';
import { useCurrentUser } from '@/modules/auth/hooks/use-auth';
import { useHasMinRole, useIsAdmin } from '@/hooks/use-role';
import { cn } from '@/lib/utils';

type StatusAction = 'start' | 'suspend' | 'complete';

const STATUS_ACTION_CONFIG: Record<
  StatusAction,
  {
    target: ProjectStatus;
    title: (projectTitle: string, isResume?: boolean) => string;
    description: (projectTitle: string, isResume?: boolean) => string;
    confirmLabel: (isResume?: boolean) => string;
    destructive?: boolean;
  }
> = {
  start: {
    target: ProjectStatus.IN_PROGRESS,
    title: (_title, isResume) =>
      isResume ? 'Reprendre ce projet ?' : 'Démarrer ce projet ?',
    description: (projectTitle, isResume) =>
      isResume
        ? `Le projet « ${projectTitle} » repassera en cours.`
        : `Le projet « ${projectTitle} » passera du statut prévu à en cours.`,
    confirmLabel: (isResume) => (isResume ? 'Reprendre' : 'Démarrer'),
  },
  suspend: {
    target: ProjectStatus.SUSPENDED,
    title: () => 'Suspendre ce projet ?',
    description: (projectTitle) =>
      `Le projet « ${projectTitle} » sera temporairement suspendu. Vous pourrez le reprendre plus tard.`,
    confirmLabel: () => 'Suspendre',
    destructive: true,
  },
  complete: {
    target: ProjectStatus.COMPLETED,
    title: () => 'Terminer ce projet ?',
    description: (projectTitle) =>
      `Le projet « ${projectTitle} » sera marqué comme terminé et l’avancement passera à 100 %.`,
    confirmLabel: () => 'Terminer',
  },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateShort(date: string | null) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function statusBadgeVariant(
  status: ProjectStatus,
): 'default' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'IN_PROGRESS':
      return 'warning';
    case 'SUSPENDED':
      return 'danger';
    default:
      return 'default';
  }
}

function taskBadgeVariant(
  status: ProjectTaskStatus,
): 'default' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'DONE':
      return 'success';
    case 'IN_PROGRESS':
      return 'warning';
    case 'CANCELLED':
      return 'danger';
    default:
      return 'default';
  }
}

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
        <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-primary-900">{value}</p>
      </div>
    </div>
  );
}

export function ProjectDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [taskTitle, setTaskTitle] = useState('');
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null);
  const [taskToComplete, setTaskToComplete] = useState<{ id: string; title: string } | null>(
    null,
  );
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const canManage = useHasMinRole(RoleCode.COMMISSION_LEAD);
  const isAdmin = useIsAdmin();
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => fetchProject(id),
    enabled: Boolean(id),
  });

  const taskMutation = useMutation({
    mutationFn: () => createProjectTask(id, { title: taskTitle.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['projects', 'list'] });
      setTaskTitle('');
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) =>
      updateProjectTask(id, taskId, { status: ProjectTaskStatus.DONE }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['projects', 'list'] });
      setTaskToComplete(null);
    },
  });

  const budgetMutation = useMutation({
    mutationFn: (budgetSpent: number) => updateProject(id, { budgetSpent }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(id) }),
  });

  const statusMutation = useMutation({
    mutationFn: (status: ProjectStatus) =>
      updateProject(id, {
        status,
        ...(status === ProjectStatus.COMPLETED ? { progressPercent: 100 } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['projects', 'list'] });
      setStatusAction(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'list'] });
      queryClient.removeQueries({ queryKey: queryKeys.projects.detail(id) });
      setDeleteOpen(false);
      navigate('/dashboard/projets');
    },
  });

  const closeStatusDialog = () => {
    if (statusMutation.isPending) return;
    setStatusAction(null);
    statusMutation.reset();
  };

  const closeCompleteTaskDialog = () => {
    if (completeTaskMutation.isPending) return;
    setTaskToComplete(null);
    completeTaskMutation.reset();
  };

  const closeDeleteDialog = () => {
    if (deleteMutation.isPending) return;
    setDeleteOpen(false);
    deleteMutation.reset();
  };
  if (isLoading) {
    return (
      <div className="space-y-4">
        <DashboardSkeleton className="h-5 w-36" />
        <DashboardSkeleton className="h-44 w-full rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-5">
          <DashboardSkeleton className="h-64 w-full rounded-2xl lg:col-span-3" />
          <DashboardSkeleton className="h-64 w-full rounded-2xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-neutral-700">Projet introuvable.</p>
        <Button asChild variant="outline">
          <Link to="/dashboard/projets">Retour aux projets</Link>
        </Button>
      </div>
    );
  }

  const budgetPercent =
    project.budgetPlanned > 0
      ? Math.round((project.budgetSpent / project.budgetPlanned) * 100)
      : 0;
  const doneTasks = project.tasks.filter((t) => t.status === 'DONE').length;
  const openTasks = project.tasks.filter(
    (t) => t.status === 'TODO' || t.status === 'IN_PROGRESS',
  ).length;
  const statusPending = statusMutation.isPending;
  const canStart =
    project.status === ProjectStatus.PLANNED || project.status === ProjectStatus.SUSPENDED;
  const canSuspend = project.status === ProjectStatus.IN_PROGRESS;
  const canComplete =
    project.status === ProjectStatus.IN_PROGRESS || project.status === ProjectStatus.SUSPENDED;
  const isResume = project.status === ProjectStatus.SUSPENDED;
  const pendingConfig = statusAction ? STATUS_ACTION_CONFIG[statusAction] : null;
  const canCompleteTasks =
    (isAdmin || Boolean(currentUser && currentUser.id === project.leadUserId)) &&
    project.status === ProjectStatus.IN_PROGRESS;
  const canChangeProjectStatus =
    canManage || Boolean(currentUser && currentUser.id === project.leadUserId);
  const canDelete = canChangeProjectStatus;
  const canEdit =
    canChangeProjectStatus && project.status === ProjectStatus.PLANNED;
  const canAddTasks =
    canManage &&
    (project.status === ProjectStatus.PLANNED ||
      project.status === ProjectStatus.IN_PROGRESS);

  return (
    <div className="space-y-4">
      <Link
        to="/dashboard/projets"
        className="group inline-flex items-center gap-2 text-sm font-medium text-neutral-400 transition-colors hover:text-primary-700"
      >
        <ArrowLeft
          className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
          aria-hidden
        />
        Retour aux projets
      </Link>

      <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-0 shadow-soft">
        <div className="bg-gradient-to-br from-primary-50/90 via-neutral-0 to-accent-50/30 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 ring-2 ring-primary-100">
                <FolderKanban className="h-6 w-6" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-700">
                  {project.commissionName}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-semibold tracking-tight text-primary-900 sm:text-2xl">
                    {project.title}
                  </h2>
                  <Badge variant={statusBadgeVariant(project.status)}>
                    {PROJECT_STATUS_LABELS[project.status]}
                  </Badge>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm text-neutral-600">
                  {project.description}
                </p>
              </div>
            </div>

            {(canEdit ||
              canDelete ||
              (canChangeProjectStatus && project.status !== ProjectStatus.COMPLETED)) && (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {canEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-neutral-0/80"
                    onClick={() => setEditOpen(true)}
                    disabled={statusPending || deleteMutation.isPending}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                    Modifier
                  </Button>
                )}
                {canDelete && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-neutral-0/80 text-red-700 hover:border-red-200 hover:bg-red-50 hover:text-red-800"
                    onClick={() => {
                      deleteMutation.reset();
                      setDeleteOpen(true);
                    }}
                    disabled={statusPending || deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    Supprimer
                  </Button>
                )}
                {canChangeProjectStatus && project.status !== ProjectStatus.COMPLETED && (
                  <>
                    {canStart && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          statusMutation.reset();
                          setStatusAction('start');
                        }}
                        disabled={statusPending}
                      >
                        <Play className="h-3.5 w-3.5" aria-hidden />
                        {isResume ? 'Reprendre' : 'Démarrer'}
                      </Button>
                    )}
                    {canSuspend && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="bg-neutral-0/80"
                        onClick={() => {
                          statusMutation.reset();
                          setStatusAction('suspend');
                        }}
                        disabled={statusPending}
                      >
                        <Pause className="h-3.5 w-3.5" aria-hidden />
                        Suspendre
                      </Button>
                    )}
                    {canComplete && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="bg-neutral-0/80 text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                        onClick={() => {
                          statusMutation.reset();
                          setStatusAction('complete');
                        }}
                        disabled={statusPending}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                        Terminer
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <InfoChip icon={UserRound} label="Responsable" value={project.leadUserName} />
            <InfoChip
              icon={CalendarDays}
              label="Période"
              value={`${formatDateShort(project.startDate)} → ${formatDateShort(project.endDate)}`}
            />
            <InfoChip
              icon={Target}
              label="Avancement"
              value={`${project.progressPercent}%`}
            />
            <InfoChip
              icon={CircleDollarSign}
              label="Budget consommé"
              value={`${budgetPercent}% · ${formatCurrency(project.budgetSpent)}`}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-3">
          {project.objectives && (
            <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
              <div className="mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary-600" aria-hidden />
                <h3 className="font-display text-sm font-semibold text-primary-900">
                  Objectifs
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-neutral-700">{project.objectives}</p>
            </section>
          )}

          <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary-600" aria-hidden />
                <h3 className="font-display text-sm font-semibold text-primary-900">
                  Tâches
                  {project.tasks.length > 0 && (
                    <span className="ml-1.5 font-normal text-neutral-400">
                      ({project.tasks.length})
                    </span>
                  )}
                </h3>
              </div>
              {project.tasks.length > 0 && (
                <p className="text-xs text-neutral-500">
                  {doneTasks} terminée{doneTasks > 1 ? 's' : ''}
                  {openTasks > 0 ? ` · ${openTasks} en cours` : ''}
                </p>
              )}
            </div>

            {canAddTasks && (
              <form
                className="mb-4 flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (taskTitle.trim()) taskMutation.mutate();
                }}
              >
                <Input
                  placeholder="Nouvelle tâche…"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="flex-1"
                  disabled={taskMutation.isPending}
                />
                <Button
                  type="submit"
                  disabled={taskMutation.isPending || !taskTitle.trim()}
                >
                  {taskMutation.isPending ? 'Ajout…' : 'Ajouter'}
                </Button>
              </form>
            )}

            {project.status === ProjectStatus.PLANNED && project.tasks.length > 0 && (
              <p className="mb-3 text-xs text-neutral-500">
                Les tâches pourront être terminées une fois le projet démarré.
              </p>
            )}

            {taskMutation.isError && (
              <p className="mb-3 rounded-xl border border-red-100 bg-red-50/60 px-3 py-2.5 text-sm text-red-600">
                {taskMutation.error.message}
              </p>
            )}

            {project.tasks.length === 0 ? (
              <p className="text-sm text-neutral-500">
                Aucune tâche pour le moment.
              </p>
            ) : (
              <ul className="space-y-2">
                {project.tasks.map((task) => {
                  const isDone = task.status === ProjectTaskStatus.DONE;
                  const isCancelled = task.status === ProjectTaskStatus.CANCELLED;
                  const canCompleteTask = canCompleteTasks && !isDone && !isCancelled;

                  return (
                    <li
                      key={task.id}
                      className="flex flex-col gap-3 rounded-xl border border-neutral-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-primary-900">{task.title}</p>
                        {task.dueDate && (
                          <p className="mt-0.5 text-xs text-neutral-500">
                            Échéance {formatDateShort(task.dueDate)}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant={taskBadgeVariant(task.status)}>
                          {PROJECT_TASK_STATUS_LABELS[task.status]}
                        </Badge>
                        {canCompleteTask && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                            onClick={() => {
                              completeTaskMutation.reset();
                              setTaskToComplete({ id: task.id, title: task.title });
                            }}
                            disabled={completeTaskMutation.isPending}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                            Terminer
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary-600" aria-hidden />
              <h3 className="font-display text-sm font-semibold text-primary-900">
                Équipe
                {project.members.length > 0 && (
                  <span className="ml-1.5 font-normal text-neutral-400">
                    ({project.members.length})
                  </span>
                )}
              </h3>
            </div>

            {project.members.length === 0 ? (
              <p className="text-sm text-neutral-500">Aucun membre assigné.</p>
            ) : (
              <ul className="space-y-2">
                {project.members.map((member) => (
                  <li
                    key={member.userId}
                    className="flex items-center gap-3 rounded-xl border border-neutral-100 px-4 py-3"
                  >
                    <UserAvatar
                      firstName={member.firstName}
                      lastName={member.lastName}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-primary-900">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="truncate text-xs text-neutral-500">{member.email}</p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-600">
                      {member.role ?? 'Membre'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {(project.partners.length > 0 || project.beneficiaries.length > 0) && (
            <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
              <div className="mb-4 flex items-center gap-2">
                <HandHeart className="h-4 w-4 text-primary-600" aria-hidden />
                <h3 className="font-display text-sm font-semibold text-primary-900">
                  Partenaires & bénéficiaires
                </h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {project.partners.length > 0 && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                      Partenaires
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {project.partners.map((partner) => (
                        <li
                          key={partner}
                          className="rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-700"
                        >
                          {partner}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {project.beneficiaries.length > 0 && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                      Bénéficiaires
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {project.beneficiaries.map((beneficiary) => (
                        <li
                          key={beneficiary}
                          className="rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-700"
                        >
                          {beneficiary}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
            <div className="mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary-600" aria-hidden />
              <h3 className="font-display text-sm font-semibold text-primary-900">
                Progression
              </h3>
            </div>
            <div className="flex items-end justify-between gap-3">
              <p className="text-3xl font-semibold tabular-nums tracking-tight text-primary-900">
                {project.progressPercent}
                <span className="ml-0.5 text-lg font-medium text-neutral-400">%</span>
              </p>
              <Badge variant={statusBadgeVariant(project.status)}>
                {PROJECT_STATUS_LABELS[project.status]}
              </Badge>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-100">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  project.status === 'COMPLETED'
                    ? 'bg-emerald-500'
                    : project.status === 'SUSPENDED'
                      ? 'bg-red-400'
                      : project.status === 'IN_PROGRESS'
                        ? 'bg-accent-500'
                        : 'bg-primary-500',
                )}
                style={{
                  width: `${Math.min(100, Math.max(0, project.progressPercent))}%`,
                }}
              />
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">Tâches terminées</dt>
                <dd className="font-medium tabular-nums text-neutral-900">
                  {doneTasks}/{project.tasks.length}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-neutral-50 pt-3">
                <dt className="text-neutral-500">Membres</dt>
                <dd className="font-medium tabular-nums text-neutral-900">
                  {project.memberCount}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-neutral-100 bg-neutral-0 p-5 shadow-soft">
            <div className="mb-3 flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4 text-primary-600" aria-hidden />
              <h3 className="font-display text-sm font-semibold text-primary-900">Budget</h3>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">Prévu</dt>
                <dd className="font-medium tabular-nums text-neutral-900">
                  {formatCurrency(project.budgetPlanned)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-neutral-50 pt-3">
                <dt className="text-neutral-500">Consommé</dt>
                <dd className="font-semibold tabular-nums text-primary-900">
                  {formatCurrency(project.budgetSpent)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-neutral-50 pt-3">
                <dt className="text-neutral-500">Taux</dt>
                <dd
                  className={cn(
                    'font-medium tabular-nums',
                    budgetPercent > 100 ? 'text-red-700' : 'text-neutral-900',
                  )}
                >
                  {budgetPercent}%
                </dd>
              </div>
            </dl>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-neutral-100">
              <div
                className={cn(
                  'h-full rounded-full',
                  budgetPercent > 100 ? 'bg-red-400' : 'bg-primary-500',
                )}
                style={{ width: `${Math.min(100, budgetPercent)}%` }}
              />
            </div>

            {canChangeProjectStatus && (
              <form
                className="mt-5 space-y-3 border-t border-neutral-50 pt-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = (e.target as HTMLFormElement)
                    .budgetSpent as HTMLInputElement;
                  budgetMutation.mutate(Number(input.value));
                }}
              >
                <Label htmlFor="budgetSpent">Mettre à jour le consommé (FCFA)</Label>
                <div className="flex gap-2">
                  <Input
                    id="budgetSpent"
                    name="budgetSpent"
                    type="number"
                    defaultValue={project.budgetSpent}
                    min={0}
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={budgetMutation.isPending}
                  >
                    OK
                  </Button>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>

      {pendingConfig && (
        <ConfirmDialog
          open={Boolean(statusAction)}
          onClose={closeStatusDialog}
          onConfirm={() => statusMutation.mutate(pendingConfig.target)}
          title={pendingConfig.title(project.title, isResume)}
          description={pendingConfig.description(project.title, isResume)}
          confirmLabel={pendingConfig.confirmLabel(isResume)}
          confirmPending={statusMutation.isPending}
          error={statusMutation.isError ? statusMutation.error.message : null}
          destructive={pendingConfig.destructive}
        />
      )}

      <ConfirmDialog
        open={Boolean(taskToComplete)}
        onClose={closeCompleteTaskDialog}
        onConfirm={() => {
          if (taskToComplete) completeTaskMutation.mutate(taskToComplete.id);
        }}
        title="Terminer cette tâche ?"
        description={
          taskToComplete
            ? `La tâche « ${taskToComplete.title} » sera marquée comme terminée. L’avancement du projet sera mis à jour.`
            : undefined
        }
        confirmLabel="Terminer"
        confirmPending={completeTaskMutation.isPending}
        error={completeTaskMutation.isError ? completeTaskMutation.error.message : null}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={closeDeleteDialog}
        onConfirm={() => deleteMutation.mutate()}
        title="Supprimer ce projet ?"
        description={`Le projet « ${project.title} » et ses tâches associées seront définitivement supprimés. Cette action est irréversible.`}
        confirmLabel="Supprimer"
        confirmPending={deleteMutation.isPending}
        error={deleteMutation.isError ? deleteMutation.error.message : null}
        destructive
      />

      <EditProjectSlideOver
        open={editOpen}
        onClose={() => setEditOpen(false)}
        project={project}
      />
    </div>
  );
}
