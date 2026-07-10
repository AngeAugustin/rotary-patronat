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
import { RoleCode, AuthUser } from '@rotary/shared-types';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/roles.guard';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CommissionsAdminService } from './commissions-admin.service';
import { CreateCommissionDto } from './dto/create-commission.dto';
import { UpdateCommissionDto } from './dto/update-commission.dto';
import { AssignMemberDto } from './dto/assign-member.dto';

@Controller('admin/commissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.ADMIN)
export class CommissionsAdminController {
  constructor(private readonly commissionsService: CommissionsAdminService) {}

  @Get()
  list(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.commissionsService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.commissionsService.findById(id).then((data) => ({ data }));
  }

  @Post()
  @UseGuards(CsrfGuard)
  create(
    @Body() dto: CreateCommissionDto,
    @CurrentUser() actor: AuthUser,
    @Req() req: Request,
  ) {
    return this.commissionsService
      .create(dto, actor.id, req.ip)
      .then((data) => ({ data }));
  }

  @Patch(':id')
  @UseGuards(CsrfGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCommissionDto,
    @CurrentUser() actor: AuthUser,
    @Req() req: Request,
  ) {
    return this.commissionsService
      .update(id, dto, actor.id, req.ip)
      .then((data) => ({ data }));
  }

  @Delete(':id')
  @UseGuards(CsrfGuard)
  remove(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUser,
    @Req() req: Request,
  ) {
    return this.commissionsService
      .remove(id, actor.id, req.ip)
      .then((data) => ({ data }));
  }

  @Post(':id/members')
  @UseGuards(CsrfGuard)
  assignMember(
    @Param('id') id: string,
    @Body() dto: AssignMemberDto,
    @CurrentUser() actor: AuthUser,
    @Req() req: Request,
  ) {
    return this.commissionsService
      .assignMember(id, dto, actor.id, req.ip)
      .then((data) => ({ data }));
  }

  @Delete(':id/members/:userId')
  @UseGuards(CsrfGuard)
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() actor: AuthUser,
    @Req() req: Request,
  ) {
    return this.commissionsService
      .removeMember(id, userId, actor.id, req.ip)
      .then((data) => ({ data }));
  }
}
