import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RoleCode, AuthUser } from '@rotary/shared-types';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SearchService } from './search.service';

@Controller('search')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.MEMBER)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(
    @CurrentUser() user: AuthUser,
    @Query('q') q: string,
    @Query('types') types?: string,
  ) {
    const typeList = types?.split(',').filter(Boolean);
    return this.searchService
      .search(user, q ?? '', typeList)
      .then((data) => ({ data }));
  }
}
