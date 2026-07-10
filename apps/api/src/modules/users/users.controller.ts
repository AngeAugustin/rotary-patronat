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
import { Request } from 'express';
import { RoleCode } from '@rotary/shared-types';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/roles.guard';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '@rotary/shared-types';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
  ) {
    return this.usersService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      q,
    );
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.usersService.findDetail(id).then((data) => ({ data }));
  }

  @Post()
  @UseGuards(CsrfGuard)
  create(
    @Body() dto: CreateUserDto,
    @CurrentUser() actor: AuthUser,
    @Req() req: Request,
  ) {
    return this.usersService
      .create(dto, actor.id, req.ip)
      .then((data) => ({ data }));
  }

  @Patch(':id')
  @UseGuards(CsrfGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthUser,
    @Req() req: Request,
  ) {
    return this.usersService
      .update(id, dto, actor.id, req.ip)
      .then((data) => ({ data }));
  }

  @Delete(':id')
  @HttpCode(200)
  @UseGuards(CsrfGuard)
  remove(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUser,
    @Req() req: Request,
  ) {
    return this.usersService
      .remove(id, actor.id, req.ip)
      .then((data) => ({ data }));
  }
}
