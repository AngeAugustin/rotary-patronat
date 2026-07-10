import { Controller, Get, UseGuards } from '@nestjs/common';
import { RoleCode } from '@rotary/shared-types';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesService } from './roles.service';

@Controller('admin/roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.ADMIN)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async list() {
    const roles = await this.rolesService.findAll();
    return { data: roles };
  }
}
