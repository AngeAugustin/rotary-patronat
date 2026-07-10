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
import { PublishStatus } from '@prisma/client';
import { Request } from 'express';
import { AuthUser, RoleCode } from '@rotary/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/roles.guard';
import { ActionsService } from './actions.service';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';

@Controller('admin/actions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.ADMIN)
export class ActionsAdminController {
  constructor(private readonly actionsService: ActionsService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('q') q?: string,
  ) {
    const parsedStatus =
      status && Object.values(PublishStatus).includes(status as PublishStatus)
        ? (status as PublishStatus)
        : undefined;
    return this.actionsService.findAllAdmin({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      status: parsedStatus,
      q,
    });
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.actionsService.findByIdAdmin(id).then((data) => ({ data }));
  }

  @Post()
  @UseGuards(CsrfGuard)
  create(
    @Body() dto: CreateActionDto,
    @CurrentUser() actor: AuthUser,
    @Req() req: Request,
  ) {
    return this.actionsService
      .createAdmin(dto, actor.id, req.ip)
      .then((data) => ({ data }));
  }

  @Patch(':id')
  @UseGuards(CsrfGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateActionDto,
    @CurrentUser() actor: AuthUser,
    @Req() req: Request,
  ) {
    return this.actionsService
      .updateAdmin(id, dto, actor.id, req.ip)
      .then((data) => ({ data }));
  }

  @Delete(':id')
  @UseGuards(CsrfGuard)
  remove(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUser,
    @Req() req: Request,
  ) {
    return this.actionsService
      .removeAdmin(id, actor.id, req.ip)
      .then((data) => ({ data }));
  }
}
