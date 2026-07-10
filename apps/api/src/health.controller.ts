import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from './common/guards/roles.guard';
import { Roles } from './common/decorators/roles.decorator';
import { RoleCode } from '@rotary/shared-types';
import { CurrentUser } from './common/decorators/current-user.decorator';
import { AuthUser } from '@rotary/shared-types';

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return { data: { status: 'ok', service: 'rotary-api' } };
  }

  @Get('protected')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.MEMBER)
  protected(@CurrentUser() user: AuthUser) {
    return { data: { message: 'Accès membre confirmé', user } };
  }
}
