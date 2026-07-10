import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { RoleCode } from '@rotary/shared-types';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { MembersService } from './members.service';

@Controller('admin/members')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.ADMIN)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('withoutAccount') withoutAccount?: string,
  ) {
    return this.membersService.findAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      q,
      withoutAccount: withoutAccount === 'true',
    });
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.membersService.findDetail(id).then((data) => ({ data }));
  }
}
