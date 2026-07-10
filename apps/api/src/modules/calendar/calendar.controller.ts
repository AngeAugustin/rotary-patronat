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
import { RoleCode, AuthUser } from '@rotary/shared-types';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/roles.guard';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CalendarService } from './calendar.service';
import {
  CreateCalendarEventDto,
  UpdateAttendanceDto,
  UpdateCalendarEventDto,
} from './dto/calendar.dto';

@Controller('calendar')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.MEMBER)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.calendarService.findInRange(user, { from, to });
  }

  @Get(':id')
  detail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.calendarService.findById(user, id).then((data) => ({ data }));
  }

  @Post()
  @UseGuards(CsrfGuard)
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCalendarEventDto,
    @Req() req: Request,
  ) {
    return this.calendarService
      .create(user, dto, req.ip)
      .then((data) => ({ data }));
  }

  @Patch(':id/attendance')
  @UseGuards(CsrfGuard)
  attendance(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceDto,
    @Req() req: Request,
  ) {
    return this.calendarService
      .updateAttendance(user, id, dto, req.ip)
      .then((data) => ({ data }));
  }

  @Patch(':id')
  @UseGuards(CsrfGuard)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCalendarEventDto,
    @Req() req: Request,
  ) {
    return this.calendarService
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
    return this.calendarService
      .remove(user, id, req.ip)
      .then((data) => ({ data }));
  }
}
