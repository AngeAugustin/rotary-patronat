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
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

@Controller('admin/news')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.ADMIN)
export class NewsAdminController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const parsedStatus =
      status && Object.values(PublishStatus).includes(status as PublishStatus)
        ? (status as PublishStatus)
        : undefined;
    return this.newsService.findAllAdmin({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      status: parsedStatus,
      q,
      categoryId,
    });
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.newsService.findByIdAdmin(id).then((data) => ({ data }));
  }

  @Post()
  @UseGuards(CsrfGuard)
  create(
    @Body() dto: CreateNewsDto,
    @CurrentUser() actor: AuthUser,
    @Req() req: Request,
  ) {
    return this.newsService
      .createAdmin(dto, actor.id, req.ip)
      .then((data) => ({ data }));
  }

  @Patch(':id')
  @UseGuards(CsrfGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateNewsDto,
    @CurrentUser() actor: AuthUser,
    @Req() req: Request,
  ) {
    return this.newsService
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
    return this.newsService
      .removeAdmin(id, actor.id, req.ip)
      .then((data) => ({ data }));
  }
}
