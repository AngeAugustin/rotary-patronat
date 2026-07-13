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
import { PostKind, RoleCode, AuthUser } from '@rotary/shared-types';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/roles.guard';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PostsService } from './posts.service';
import {
  CreateCommentDto,
  CreateContentReportDto,
  CreatePostDto,
  UpdatePostDto,
} from './dto/create-post.dto';

@Controller('posts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.MEMBER)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  feed(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('kind') kind?: PostKind,
    @Query('commissionId') commissionId?: string,
  ) {
    return this.postsService.getFeed(user, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      kind: kind as PostKind | undefined,
      commissionId,
    });
  }

  @Get(':id')
  detail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.postsService.findById(user, id).then((data) => ({ data }));
  }

  @Post()
  @UseGuards(CsrfGuard)
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePostDto,
    @Req() req: Request,
  ) {
    return this.postsService.create(user, dto, req.ip).then((data) => ({ data }));
  }

  @Post('reports')
  @UseGuards(CsrfGuard)
  report(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateContentReportDto,
    @Req() req: Request,
  ) {
    return this.postsService.report(user, dto, req.ip).then((data) => ({ data }));
  }

  @Patch(':id')
  @UseGuards(CsrfGuard)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @Req() req: Request,
  ) {
    return this.postsService
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
    return this.postsService.deleteOwn(user, id, req.ip).then((data) => ({ data }));
  }

  @Post(':id/like')
  @UseGuards(CsrfGuard)
  like(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.postsService.toggleLike(user, id, req.ip).then((data) => ({ data }));
  }

  @Post(':id/comments')
  @UseGuards(CsrfGuard)
  comment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @Req() req: Request,
  ) {
    return this.postsService
      .addComment(user, id, dto, req.ip)
      .then((data) => ({ data }));
  }
}
