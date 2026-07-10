import { z } from 'zod';

export const ProjectStatus = {
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  SUSPENDED: 'SUSPENDED',
  COMPLETED: 'COMPLETED',
} as const;

export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNED]: 'Prévu',
  [ProjectStatus.IN_PROGRESS]: 'En cours',
  [ProjectStatus.SUSPENDED]: 'Suspendu',
  [ProjectStatus.COMPLETED]: 'Terminé',
};

export const ProjectTaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED',
} as const;

export type ProjectTaskStatus = (typeof ProjectTaskStatus)[keyof typeof ProjectTaskStatus];

export const PROJECT_TASK_STATUS_LABELS: Record<ProjectTaskStatus, string> = {
  [ProjectTaskStatus.TODO]: 'À faire',
  [ProjectTaskStatus.IN_PROGRESS]: 'En cours',
  [ProjectTaskStatus.DONE]: 'Terminé',
  [ProjectTaskStatus.CANCELLED]: 'Annulé',
};

export const projectSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  commissionId: z.string().uuid(),
  commissionName: z.string(),
  leadUserId: z.string().uuid(),
  leadUserName: z.string(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'SUSPENDED', 'COMPLETED']),
  progressPercent: z.number().int().min(0).max(100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable(),
  budgetPlanned: z.number(),
  budgetSpent: z.number(),
  memberCount: z.number().int(),
  taskCount: z.number().int(),
});

export type ProjectSummary = z.infer<typeof projectSummarySchema>;

export const projectTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  assigneeId: z.string().uuid().nullable(),
  assigneeName: z.string().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']),
  dueDate: z.string().datetime().nullable(),
  sortOrder: z.number().int(),
});

export type ProjectTask = z.infer<typeof projectTaskSchema>;

export const projectMemberSchema = z.object({
  userId: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  role: z.string().nullable(),
});

export type ProjectMember = z.infer<typeof projectMemberSchema>;

export const projectHistorySchema = z.object({
  id: z.string().uuid(),
  action: z.string(),
  changes: z.record(z.unknown()).nullable(),
  createdAt: z.string().datetime(),
  userName: z.string().nullable(),
});

export type ProjectHistoryEntry = z.infer<typeof projectHistorySchema>;

export const projectDetailSchema = projectSummarySchema.extend({
  objectives: z.string().nullable(),
  partners: z.array(z.string()).default([]),
  beneficiaries: z.array(z.string()).default([]),
  members: z.array(projectMemberSchema),
  tasks: z.array(projectTaskSchema),
  history: z.array(projectHistorySchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ProjectDetail = z.infer<typeof projectDetailSchema>;

export const createProjectSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().min(1),
  objectives: z.string().optional(),
  commissionId: z.string().uuid(),
  leadUserId: z.string().uuid(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'SUSPENDED', 'COMPLETED']).optional(),
  progressPercent: z.number().int().min(0).max(100).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  budgetPlanned: z.number().min(0),
  budgetSpent: z.number().min(0).optional(),
  partners: z.array(z.string()).optional(),
  beneficiaries: z.array(z.string()).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial();

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const createProjectTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assigneeId: z.string().uuid().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
  dueDate: z.string().datetime().optional(),
});

export type CreateProjectTaskInput = z.infer<typeof createProjectTaskSchema>;

export const assignProjectMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.string().optional(),
});

export type AssignProjectMemberInput = z.infer<typeof assignProjectMemberSchema>;
