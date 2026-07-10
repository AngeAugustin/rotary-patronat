import { Controller, Get, UseGuards } from '@nestjs/common';
import { RoleCode } from '@rotary/shared-types';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '@rotary/shared-types';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.MEMBER)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async overview(@CurrentUser() user: AuthUser) {
    const data = await this.dashboardService.getDashboard(user);
    return { data };
  }
}
