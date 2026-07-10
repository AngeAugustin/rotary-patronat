import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PostKind, RoleCode, AuthUser } from '@rotary/shared-types';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PostsService } from '../posts/posts.service';

@Controller('feed')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.MEMBER)
export class NewsFeedController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('kind') kind?: PostKind,
  ) {
    return this.postsService.getFeed(user, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      kind: kind as PostKind | undefined,
    });
  }
}
