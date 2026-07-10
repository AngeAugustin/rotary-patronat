import {
  Body,
  Controller,
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
import { MessagingService } from './messaging.service';
import { CreateConversationDto, SendMessageDto } from './dto/messaging.dto';

@Controller('conversations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.MEMBER)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messagingService.listConversations(user, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('recipients')
  recipients(@CurrentUser() user: AuthUser, @Query('q') q?: string) {
    return this.messagingService
      .listRecipients(user, q)
      .then((data) => ({ data }));
  }

  @Get(':id')
  detail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.messagingService
      .getConversation(user, id)
      .then((data) => ({ data }));
  }

  @Post()
  @UseGuards(CsrfGuard)
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateConversationDto,
    @Req() req: Request,
  ) {
    return this.messagingService
      .createConversation(user, dto, req.ip)
      .then((data) => ({ data }));
  }

  @Post(':id/messages')
  @UseGuards(CsrfGuard)
  send(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Req() req: Request,
  ) {
    return this.messagingService
      .sendMessage(user, id, dto, req.ip)
      .then((data) => ({ data }));
  }

  @Patch(':id/delivered')
  @UseGuards(CsrfGuard)
  markDelivered(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.messagingService
      .acknowledgeDelivered(user, id)
      .then((data) => ({ data }));
  }

  @Patch(':id/read')
  @UseGuards(CsrfGuard)
  markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.messagingService.markRead(user, id).then((data) => ({ data }));
  }
}
