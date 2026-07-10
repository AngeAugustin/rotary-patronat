import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ProjectStatus } from '@prisma/client';
import { RoleCode, AuthUser } from '@rotary/shared-types';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/roles.guard';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateProjectTaskDto } from './dto/create-project-task.dto';
import { UpdateProjectTaskDto } from './dto/update-project-task.dto';
import { AssignProjectMemberDto } from './dto/assign-project-member.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.MEMBER)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('commissionId') commissionId?: string,
    @Query('status') status?: ProjectStatus,
  ) {
    return this.projectsService.findAll(user, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      commissionId,
      status,
    });
  }

  @Get(':id')
  detail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.projectsService.findById(user, id).then((data) => ({ data }));
  }

  @Post()
  @UseGuards(CsrfGuard)
  @Roles(RoleCode.COMMISSION_LEAD)
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateProjectDto,
    @Req() req: Request,
  ) {
    return this.projectsService
      .create(user, dto, req.ip)
      .then((data) => ({ data }));
  }

  @Patch(':id')
  @UseGuards(CsrfGuard)
  @Roles(RoleCode.MEMBER)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @Req() req: Request,
  ) {
    return this.projectsService
      .update(user, id, dto, req.ip)
      .then((data) => ({ data }));
  }

  @Delete(':id')
  @UseGuards(CsrfGuard)
  @Roles(RoleCode.MEMBER)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.projectsService
      .remove(user, id, req.ip)
      .then((data) => ({ data }));
  }

  @Post(':id/members')
  @UseGuards(CsrfGuard)
  @Roles(RoleCode.COMMISSION_LEAD)
  assignMember(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AssignProjectMemberDto,
    @Req() req: Request,
  ) {
    return this.projectsService
      .assignMember(user, id, dto, req.ip)
      .then((data) => ({ data }));
  }

  @Delete(':id/members/:userId')
  @UseGuards(CsrfGuard)
  @Roles(RoleCode.COMMISSION_LEAD)
  removeMember(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Req() req: Request,
  ) {
    return this.projectsService
      .removeMember(user, id, userId, req.ip)
      .then((data) => ({ data }));
  }

  @Post(':id/tasks')
  @UseGuards(CsrfGuard)
  @Roles(RoleCode.COMMISSION_LEAD)
  createTask(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateProjectTaskDto,
    @Req() req: Request,
  ) {
    return this.projectsService
      .createTask(user, id, dto, req.ip)
      .then((data) => ({ data }));
  }

  @Patch(':id/tasks/:taskId')
  @UseGuards(CsrfGuard)
  @Roles(RoleCode.MEMBER)
  updateTask(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateProjectTaskDto,
    @Req() req: Request,
  ) {
    return this.projectsService
      .updateTask(user, id, taskId, dto, req.ip)
      .then((data) => ({ data }));
  }
}
