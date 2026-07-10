import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FolderKanban } from 'lucide-react';
import {
  PROJECT_STATUS_LABELS,
  ProjectStatus,
  RoleCode,
  type ProjectStatus as ProjectStatusType,
} from '@rotary/shared-types';
import { fetchProjects } from '../api';
import { queryKeys } from '@/lib/query-keys';
import { ProjectCard, ProjectCardSkeleton } from '../components/ProjectCard';
import { CreateProjectSlideOver } from '../components/CreateProjectSlideOver';
import { Button } from '@/components/ui/button';
import { useHasMinRole } from '@/hooks/use-role';
import { cn } from '@/lib/utils';
import {
  DashboardPageShell,
  DashboardPageHeader,
  DashboardEmptyState,
  DashboardPagination,
} from '@/modules/dashboard/components/layout';

const STATUS_FILTERS: { value: ProjectStatusType | ''; label: string }[] = [
  { value: '', label: 'Tous' },
  { value: ProjectStatus.PLANNED, label: PROJECT_STATUS_LABELS.PLANNED },
  { value: ProjectStatus.IN_PROGRESS, label: PROJECT_STATUS_LABELS.IN_PROGRESS },
  { value: ProjectStatus.SUSPENDED, label: PROJECT_STATUS_LABELS.SUSPENDED },
  { value: ProjectStatus.COMPLETED, label: PROJECT_STATUS_LABELS.COMPLETED },
];

function isProjectStatus(value: string): value is ProjectStatusType {
  return Object.values(ProjectStatus).includes(value as ProjectStatusType);
}

export function ProjectsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get('status') ?? '';
  const status = isProjectStatus(statusParam) ? statusParam : '';
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const canCreate = useHasMinRole(RoleCode.COMMISSION_LEAD);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.projects.list(`${page}-${status || 'all'}`),
    queryFn: () => fetchProjects({ page, status: status || undefined }),
  });

  const setStatusFilter = (nextStatus: string) => {
    const params = new URLSearchParams(searchParams);
    if (nextStatus) params.set('status', nextStatus);
    else params.delete('status');
    setSearchParams(params);
    setPage(1);
  };

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Gestion"
        title="Projets"
        description="Suivi des initiatives par commission."
        action={
          canCreate ? (
            <Button type="button" onClick={() => setShowCreate(true)}>
              Nouveau projet
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-2 rounded-2xl border border-neutral-100 bg-neutral-0 p-2 shadow-soft">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value || 'all'}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              status === filter.value
                ? 'bg-primary-700 text-neutral-0'
                : 'text-neutral-700 hover:bg-neutral-50',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <ProjectCardSkeleton key={i} />)
          : data?.data.map((project) => <ProjectCard key={project.id} project={project} />)}
      </div>

      {!isLoading && data?.data.length === 0 && (
        <DashboardEmptyState
          message={status ? 'Aucun projet pour ce statut' : 'Aucun projet pour le moment'}
          description={
            status
              ? 'Modifiez le filtre ou créez un nouveau projet.'
              : 'Les projets de vos commissions apparaîtront ici.'
          }
          icon={FolderKanban}
          action={
            canCreate ? (
              <Button type="button" onClick={() => setShowCreate(true)}>
                Créer un projet
              </Button>
            ) : undefined
          }
        />
      )}

      {data && (
        <DashboardPagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          onPageChange={setPage}
        />
      )}

      {canCreate && (
        <CreateProjectSlideOver
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onCreated={(projectId) => navigate(`/dashboard/projets/${projectId}`)}
        />
      )}
    </DashboardPageShell>
  );
}
