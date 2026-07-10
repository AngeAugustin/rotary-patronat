import { Controller, Get, UseGuards } from '@nestjs/common';
import { RoleCode } from '@rotary/shared-types';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { StatsService } from './stats.service';

@Controller('admin/stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.ADMIN)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  async global() {
    const data = await this.statsService.getGlobalStats();
    return { data };
  }
}
