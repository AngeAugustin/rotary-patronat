import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RoleCode } from '@rotary/shared-types';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { LogsService } from './logs.service';

@Controller('admin/logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.ADMIN)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
  ) {
    return this.logsService.findAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 30,
      action,
      userId,
    });
  }
}
