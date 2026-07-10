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
import { VolunteeringStatus } from '@prisma/client';
import { RoleCode, AuthUser } from '@rotary/shared-types';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/roles.guard';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { VolunteeringService } from './volunteering.service';
import {
  CreateVolunteeringDto,
  ReviewVolunteeringDto,
  UpdateVolunteeringDto,
} from './dto/volunteering.dto';

@Controller('volunteering')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.MEMBER)
export class VolunteeringController {
  constructor(private readonly volunteeringService: VolunteeringService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: VolunteeringStatus,
    @Query('userId') userId?: string,
    @Query('scope') scope?: 'mine' | 'all',
  ) {
    return this.volunteeringService.findAll(user, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      status,
      userId,
      scope,
    });
  }

  @Get('stats')
  stats(@CurrentUser() user: AuthUser, @Query('userId') userId?: string) {
    return this.volunteeringService
      .getStats(user, userId)
      .then((data) => ({ data }));
  }

  @Post()
  @UseGuards(CsrfGuard)
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateVolunteeringDto,
    @Req() req: Request,
  ) {
    return this.volunteeringService
      .create(user, dto, req.ip)
      .then((data) => ({ data }));
  }

  @Patch(':id/review')
  @UseGuards(CsrfGuard)
  @Roles(RoleCode.ADMIN)
  review(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReviewVolunteeringDto,
    @Req() req: Request,
  ) {
    return this.volunteeringService
      .review(user, id, dto, req.ip)
      .then((data) => ({ data }));
  }

  @Patch(':id')
  @UseGuards(CsrfGuard)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateVolunteeringDto,
    @Req() req: Request,
  ) {
    return this.volunteeringService
      .update(user, id, dto, req.ip)
      .then((data) => ({ data }));
  }

  @Delete(':id')
  @UseGuards(CsrfGuard)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.volunteeringService
      .remove(user, id, req.ip)
      .then((data) => ({ data }));
  }
}
