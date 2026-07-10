import type {
  AssignProjectMemberInput,
  CreateProjectInput,
  CreateProjectTaskInput,
  PaginatedResponse,
  ProjectDetail,
  ProjectSummary,
  UpdateProjectInput,
} from '@rotary/shared-types';
import { apiRequest } from '@/lib/api-client';

export async function fetchProjects(params?: {
  page?: number;
  commissionId?: string;
  status?: string;
}) {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.commissionId) search.set('commissionId', params.commissionId);
  if (params?.status) search.set('status', params.status);
  const qs = search.toString();
  return apiRequest<PaginatedResponse<ProjectSummary>>(
    `/projects${qs ? `?${qs}` : ''}`,
  );
}

export async function fetchProject(id: string) {
  const res = await apiRequest<{ data: ProjectDetail }>(`/projects/${id}`);
  return res.data;
}

export async function createProject(input: CreateProjectInput) {
  const res = await apiRequest<{ data: ProjectSummary }>('/projects', {
    method: 'POST',
    body: input,
  });
  return res.data;
}

export async function updateProject(id: string, input: UpdateProjectInput) {
  const res = await apiRequest<{ data: ProjectSummary }>(`/projects/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return res.data;
}

export async function deleteProject(id: string) {
  const res = await apiRequest<{ data: { success: boolean } }>(`/projects/${id}`, {
    method: 'DELETE',
  });
  return res.data;
}

export async function assignProjectMember(
  projectId: string,
  input: AssignProjectMemberInput,
) {
  const res = await apiRequest<{ data: ProjectDetail }>(
    `/projects/${projectId}/members`,
    { method: 'POST', body: input },
  );
  return res.data;
}

export async function removeProjectMember(projectId: string, userId: string) {
  const res = await apiRequest<{ data: ProjectDetail }>(
    `/projects/${projectId}/members/${userId}`,
    { method: 'DELETE' },
  );
  return res.data;
}

export async function createProjectTask(
  projectId: string,
  input: CreateProjectTaskInput,
) {
  const res = await apiRequest<{ data: ProjectDetail }>(
    `/projects/${projectId}/tasks`,
    { method: 'POST', body: input },
  );
  return res.data;
}

export async function updateProjectTask(
  projectId: string,
  taskId: string,
  input: Partial<CreateProjectTaskInput>,
) {
  const res = await apiRequest<{ data: ProjectDetail }>(
    `/projects/${projectId}/tasks/${taskId}`,
    { method: 'PATCH', body: input },
  );
  return res.data;
}
