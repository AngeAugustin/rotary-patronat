import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProjectStatus, ProjectTaskStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AssignProjectMemberInput,
  AuthUser,
  CreateProjectInput,
  CreateProjectTaskInput,
  ProjectDetail,
  ProjectSummary,
  RoleCode,
  UpdateProjectInput,
} from '@rotary/shared-types';
import { LogsService } from '../logs/logs.service';
import { buildMeta, resolvePagination } from '../../common/utils/pagination';

interface ProjectQuery {
  page?: number;
  limit?: number;
  commissionId?: string;
  status?: ProjectStatus;
}

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logsService: LogsService,
  ) {}

  async findAll(user: AuthUser, query: ProjectQuery) {
    const { skip, take, page, limit } = resolvePagination(query);
    const where = await this.buildListFilter(user, query);

    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: this.summaryInclude(),
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: items.map((p) => this.toSummary(p)),
      meta: buildMeta(page, limit, total),
    };
  }

  async findById(user: AuthUser, id: string): Promise<ProjectDetail> {
    const project = await this.getProjectOrThrow(id);
    await this.assertCanAccess(user, project);

    const full = await this.prisma.project.findUniqueOrThrow({
      where: { id },
      include: {
        ...this.summaryInclude(),
        members: { include: { user: true } },
        tasks: { include: { assignee: true }, orderBy: { sortOrder: 'asc' } },
        history: {
          include: { user: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    return this.toDetail(full);
  }

  async create(user: AuthUser, input: CreateProjectInput, ipAddress?: string) {
    await this.assertCanManageCommission(user, input.commissionId);

    const project = await this.prisma.project.create({
      data: {
        title: input.title,
        slug: input.slug,
        description: input.description,
        objectives: input.objectives,
        commissionId: input.commissionId,
        leadUserId: input.leadUserId,
        status: (input.status as ProjectStatus) ?? ProjectStatus.PLANNED,
        progressPercent: input.progressPercent ?? 0,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        budgetPlanned: input.budgetPlanned,
        budgetSpent: input.budgetSpent ?? 0,
        partners: input.partners ?? [],
        beneficiaries: input.beneficiaries ?? [],
        members: {
          create: [{ userId: input.leadUserId, role: 'Responsable du projet' }],
        },
      },
      include: this.summaryInclude(),
    });

    await this.recordHistory(project.id, user.id, 'PROJECT_CREATE', { title: input.title });
    await this.logsService.logActivity({
      userId: user.id,
      action: 'PROJECT_CREATE',
      resource: 'projects',
      resourceId: project.id,
      ipAddress,
    });

    return this.toSummary(project);
  }

  async update(
    user: AuthUser,
    id: string,
    input: UpdateProjectInput,
    ipAddress?: string,
  ) {
    const existing = await this.getProjectOrThrow(id);
    await this.assertCanManage(user, existing);

    const structuralKeys: (keyof UpdateProjectInput)[] = [
      'title',
      'slug',
      'description',
      'objectives',
      'commissionId',
      'leadUserId',
      'startDate',
      'endDate',
      'budgetPlanned',
      'partners',
      'beneficiaries',
    ];
    const hasStructuralChange = structuralKeys.some(
      (key) => input[key] !== undefined,
    );

    if (hasStructuralChange && existing.status !== ProjectStatus.PLANNED) {
      throw new BadRequestException({
        error: {
          code: 'PROJECT_NOT_EDITABLE',
          message:
            'Seuls les projets au statut « Prévu » peuvent être modifiés dans leur contenu',
        },
      });
    }

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        title: input.title,
        slug: input.slug,
        description: input.description,
        objectives: input.objectives,
        commissionId: input.commissionId,
        leadUserId: input.leadUserId,
        status: input.status as ProjectStatus | undefined,
        progressPercent: input.progressPercent,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : input.endDate === null ? null : undefined,
        budgetPlanned: input.budgetPlanned,
        budgetSpent: input.budgetSpent,
        partners: input.partners,
        beneficiaries: input.beneficiaries,
      },
      include: this.summaryInclude(),
    });

    await this.recordHistory(id, user.id, 'PROJECT_UPDATE', input as Record<string, unknown>);
    await this.logsService.logActivity({
      userId: user.id,
      action: 'PROJECT_UPDATE',
      resource: 'projects',
      resourceId: id,
      ipAddress,
    });

    return this.toSummary(project);
  }

  async remove(user: AuthUser, id: string, ipAddress?: string) {
    const existing = await this.getProjectOrThrow(id);
    await this.assertCanManage(user, existing);

    await this.prisma.project.delete({ where: { id } });

    await this.logsService.logActivity({
      userId: user.id,
      action: 'PROJECT_DELETE',
      resource: 'projects',
      resourceId: id,
      metadata: { title: existing.title },
      ipAddress,
    });

    return { success: true };
  }

  async assignMember(
    user: AuthUser,
    projectId: string,
    input: AssignProjectMemberInput,
    ipAddress?: string,
  ) {
    const project = await this.getProjectOrThrow(projectId);
    await this.assertCanManage(user, project);

    const isCommissionMember = await this.prisma.commissionMember.findUnique({
      where: {
        userId_commissionId: {
          userId: input.userId,
          commissionId: project.commissionId,
        },
      },
    });

    if (!isCommissionMember) {
      throw new ForbiddenException({
        error: {
          code: 'NOT_COMMISSION_MEMBER',
          message: 'Le membre doit appartenir à la commission du projet',
        },
      });
    }

    await this.prisma.projectMember.upsert({
      where: {
        projectId_userId: { projectId, userId: input.userId },
      },
      update: { role: input.role },
      create: { projectId, userId: input.userId, role: input.role },
    });

    await this.recordHistory(projectId, user.id, 'PROJECT_MEMBER_ASSIGN', input);
    await this.logsService.logActivity({
      userId: user.id,
      action: 'PROJECT_MEMBER_ASSIGN',
      resource: 'projects',
      resourceId: projectId,
      metadata: { targetUserId: input.userId },
      ipAddress,
    });

    return this.findById(user, projectId);
  }

  async removeMember(
    user: AuthUser,
    projectId: string,
    memberUserId: string,
    ipAddress?: string,
  ) {
    const project = await this.getProjectOrThrow(projectId);
    await this.assertCanManage(user, project);

    if (memberUserId === project.leadUserId) {
      throw new ForbiddenException({
        error: { code: 'CANNOT_REMOVE_LEAD', message: 'Impossible de retirer le responsable du projet' },
      });
    }

    await this.prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId: memberUserId } },
    });

    await this.recordHistory(projectId, user.id, 'PROJECT_MEMBER_REMOVE', { userId: memberUserId });
    await this.logsService.logActivity({
      userId: user.id,
      action: 'PROJECT_MEMBER_REMOVE',
      resource: 'projects',
      resourceId: projectId,
      metadata: { targetUserId: memberUserId },
      ipAddress,
    });

    return this.findById(user, projectId);
  }

  async createTask(
    user: AuthUser,
    projectId: string,
    input: CreateProjectTaskInput,
    ipAddress?: string,
  ) {
    const project = await this.getProjectOrThrow(projectId);
    await this.assertCanManage(user, project);

    const count = await this.prisma.projectTask.count({ where: { projectId } });

    await this.prisma.projectTask.create({
      data: {
        projectId,
        title: input.title,
        description: input.description,
        assigneeId: input.assigneeId,
        status: (input.status as ProjectTaskStatus) ?? ProjectTaskStatus.TODO,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        sortOrder: count,
      },
    });

    await this.recordHistory(projectId, user.id, 'PROJECT_TASK_CREATE', { title: input.title });
    await this.logsService.logActivity({
      userId: user.id,
      action: 'PROJECT_TASK_CREATE',
      resource: 'projects',
      resourceId: projectId,
      ipAddress,
    });

    return this.findById(user, projectId);
  }

  async updateTask(
    user: AuthUser,
    projectId: string,
    taskId: string,
    input: Partial<CreateProjectTaskInput>,
    ipAddress?: string,
  ) {
    const project = await this.getProjectOrThrow(projectId);
    this.assertIsAdminOrProjectLead(user, project);

    if (input.status !== undefined && project.status !== ProjectStatus.IN_PROGRESS) {
      throw new BadRequestException({
        error: {
          code: 'PROJECT_NOT_STARTED',
          message:
            'Les tâches ne peuvent être mises à jour que lorsque le projet est en cours',
        },
      });
    }

    await this.prisma.projectTask.update({
      where: { id: taskId },
      data: {
        title: input.title,
        description: input.description,
        assigneeId: input.assigneeId,
        status: input.status as ProjectTaskStatus | undefined,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      },
    });

    await this.recalculateProgress(projectId);
    await this.recordHistory(projectId, user.id, 'PROJECT_TASK_UPDATE', { taskId, ...input });
    await this.logsService.logActivity({
      userId: user.id,
      action: 'PROJECT_TASK_UPDATE',
      resource: 'projects',
      resourceId: projectId,
      ipAddress,
    });

    return this.findById(user, projectId);
  }

  private async buildListFilter(
    user: AuthUser,
    query: ProjectQuery,
  ): Promise<Prisma.ProjectWhereInput> {
    const base: Prisma.ProjectWhereInput = {
      ...(query.commissionId ? { commissionId: query.commissionId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    if (user.roles.includes(RoleCode.ADMIN)) {
      return base;
    }

    const [commissionIds, projectIds] = await Promise.all([
      this.prisma.commissionMember
        .findMany({ where: { userId: user.id }, select: { commissionId: true } })
        .then((rows) => rows.map((r) => r.commissionId)),
      this.prisma.projectMember
        .findMany({ where: { userId: user.id }, select: { projectId: true } })
        .then((rows) => rows.map((r) => r.projectId)),
    ]);

    const ledCommissionIds = await this.prisma.commission
      .findMany({ where: { leadUserId: user.id }, select: { id: true } })
      .then((rows) => rows.map((r) => r.id));

    return {
      ...base,
      OR: [
        { commissionId: { in: [...commissionIds, ...ledCommissionIds] } },
        { id: { in: projectIds } },
        { leadUserId: user.id },
      ],
    };
  }

  private async getProjectOrThrow(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException({
        error: { code: 'PROJECT_NOT_FOUND', message: 'Projet introuvable' },
      });
    }
    return project;
  }

  private async assertCanAccess(user: AuthUser, project: { id: string; commissionId: string; leadUserId: string }) {
    if (user.roles.includes(RoleCode.ADMIN)) return;

    const [commissionMember, projectMember, ledCommission] = await Promise.all([
      this.prisma.commissionMember.findUnique({
        where: { userId_commissionId: { userId: user.id, commissionId: project.commissionId } },
      }),
      this.prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: project.id, userId: user.id } },
      }),
      this.prisma.commission.findFirst({
        where: { id: project.commissionId, leadUserId: user.id },
      }),
    ]);

    if (!commissionMember && !projectMember && !ledCommission && project.leadUserId !== user.id) {
      throw new ForbiddenException({
        error: { code: 'FORBIDDEN', message: 'Accès non autorisé à ce projet' },
      });
    }
  }

  private async assertCanManage(
    user: AuthUser,
    project: { commissionId: string; leadUserId: string },
  ) {
    if (user.roles.includes(RoleCode.ADMIN)) return;
    if (project.leadUserId === user.id) return;

    const ledCommission = await this.prisma.commission.findFirst({
      where: { id: project.commissionId, leadUserId: user.id },
    });

    if (!ledCommission) {
      throw new ForbiddenException({
        error: { code: 'FORBIDDEN', message: 'Droits insuffisants sur ce projet' },
      });
    }
  }

  private assertIsAdminOrProjectLead(
    user: AuthUser,
    project: { leadUserId: string },
  ) {
    if (user.roles.includes(RoleCode.ADMIN)) return;
    if (project.leadUserId === user.id) return;

    throw new ForbiddenException({
      error: {
        code: 'FORBIDDEN',
        message: 'Seuls l’administrateur et le responsable du projet peuvent modifier une tâche',
      },
    });
  }

  private async assertCanManageCommission(user: AuthUser, commissionId: string) {
    if (user.roles.includes(RoleCode.ADMIN)) return;

    const led = await this.prisma.commission.findFirst({
      where: { id: commissionId, leadUserId: user.id },
    });

    if (!led) {
      throw new ForbiddenException({
        error: { code: 'FORBIDDEN', message: 'Seuls les administrateurs et responsables de commission peuvent créer un projet' },
      });
    }
  }

  private async recalculateProgress(projectId: string) {
    const tasks = await this.prisma.projectTask.findMany({
      where: { projectId, status: { not: ProjectTaskStatus.CANCELLED } },
    });

    if (tasks.length === 0) return;

    const done = tasks.filter((t) => t.status === ProjectTaskStatus.DONE).length;
    const progress = Math.round((done / tasks.length) * 100);

    await this.prisma.project.update({
      where: { id: projectId },
      data: { progressPercent: progress },
    });
  }

  private async recordHistory(
    projectId: string,
    userId: string,
    action: string,
    changes?: Record<string, unknown>,
  ) {
    await this.prisma.projectHistory.create({
      data: { projectId, userId, action, changes: changes as Prisma.InputJsonValue },
    });
  }

  private summaryInclude() {
    return {
      commission: true,
      leadUser: true,
      _count: { select: { members: true, tasks: true } },
    } as const;
  }

  private toSummary(
    project: {
      id: string;
      title: string;
      slug: string;
      description: string;
      commissionId: string;
      leadUserId: string;
      status: ProjectStatus;
      progressPercent: number;
      startDate: Date;
      endDate: Date | null;
      budgetPlanned: Prisma.Decimal;
      budgetSpent: Prisma.Decimal;
      commission: { name: string };
      leadUser: { firstName: string; lastName: string };
      _count: { members: number; tasks: number };
    },
  ): ProjectSummary {
    return {
      id: project.id,
      title: project.title,
      slug: project.slug,
      description: project.description,
      commissionId: project.commissionId,
      commissionName: project.commission.name,
      leadUserId: project.leadUserId,
      leadUserName: `${project.leadUser.firstName} ${project.leadUser.lastName}`,
      status: project.status,
      progressPercent: project.progressPercent,
      startDate: project.startDate.toISOString(),
      endDate: project.endDate?.toISOString() ?? null,
      budgetPlanned: Number(project.budgetPlanned),
      budgetSpent: Number(project.budgetSpent),
      memberCount: project._count.members,
      taskCount: project._count.tasks,
    };
  }

  private toDetail(
    project: {
      id: string;
      title: string;
      slug: string;
      description: string;
      objectives: string | null;
      commissionId: string;
      leadUserId: string;
      status: ProjectStatus;
      progressPercent: number;
      startDate: Date;
      endDate: Date | null;
      budgetPlanned: Prisma.Decimal;
      budgetSpent: Prisma.Decimal;
      partners: Prisma.JsonValue;
      beneficiaries: Prisma.JsonValue;
      createdAt: Date;
      updatedAt: Date;
      commission: { name: string };
      leadUser: { firstName: string; lastName: string };
      _count: { members: number; tasks: number };
      members: Array<{
        userId: string;
        role: string | null;
        user: { firstName: string; lastName: string; email: string };
      }>;
      tasks: Array<{
        id: string;
        title: string;
        description: string | null;
        assigneeId: string | null;
        status: ProjectTaskStatus;
        dueDate: Date | null;
        sortOrder: number;
        assignee: { firstName: string; lastName: string } | null;
      }>;
      history: Array<{
        id: string;
        action: string;
        changes: Prisma.JsonValue;
        createdAt: Date;
        user: { firstName: string; lastName: string } | null;
      }>;
    },
  ): ProjectDetail {
    return {
      ...this.toSummary(project),
      objectives: project.objectives,
      partners: this.parseStringArray(project.partners),
      beneficiaries: this.parseStringArray(project.beneficiaries),
      members: project.members.map((m) => ({
        userId: m.userId,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        email: m.user.email,
        role: m.role,
      })),
      tasks: project.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        assigneeId: t.assigneeId,
        assigneeName: t.assignee
          ? `${t.assignee.firstName} ${t.assignee.lastName}`
          : null,
        status: t.status,
        dueDate: t.dueDate?.toISOString() ?? null,
        sortOrder: t.sortOrder,
      })),
      history: project.history.map((h) => ({
        id: h.id,
        action: h.action,
        changes: h.changes as Record<string, unknown> | null,
        createdAt: h.createdAt.toISOString(),
        userName: h.user ? `${h.user.firstName} ${h.user.lastName}` : null,
      })),
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }

  private parseStringArray(value: Prisma.JsonValue): string[] {
    if (!value || !Array.isArray(value)) return [];
    return value.filter((v): v is string => typeof v === 'string');
  }
}
