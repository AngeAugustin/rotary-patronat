import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MembershipApplicationStatus } from '@prisma/client';
import { Request } from 'express';
import { AuthUser, RoleCode } from '@rotary/shared-types';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/roles.guard';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MembershipService } from './membership.service';
import {
  CreateMembershipApplicationDto,
  ReviewMembershipApplicationDto,
} from './dto/membership.dto';

@Controller('membership-applications')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Post()
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  create(@Body() dto: CreateMembershipApplicationDto, @Req() req: Request) {
    return this.membershipService
      .create(dto, req.ip)
      .then((data) => ({ data }));
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  list(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: MembershipApplicationStatus,
  ) {
    return this.membershipService.findAll(user, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      status,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.membershipService.findOne(user, id).then((data) => ({ data }));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, CsrfGuard)
  @Roles(RoleCode.ADMIN)
  review(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReviewMembershipApplicationDto,
    @Req() req: Request,
  ) {
    return this.membershipService
      .review(user, id, dto, req.ip)
      .then((data) => ({ data }));
  }

  @Delete(':id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard, CsrfGuard)
  @Roles(RoleCode.ADMIN)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.membershipService
      .remove(user, id, req.ip)
      .then((data) => ({ data }));
  }
}
