import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { DocumentVisibility } from '@prisma/client';
import { RoleCode, AuthUser } from '@rotary/shared-types';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/roles.guard';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.MEMBER)
  categories(@CurrentUser() user: AuthUser) {
    return this.documentsService.findCategories(user).then((data) => ({ data }));
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.MEMBER)
  list(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('categoryId') categoryId?: string,
    @Query('visibility') visibility?: DocumentVisibility,
    @Query('commissionId') commissionId?: string,
  ) {
    return this.documentsService.findAll(user, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      q,
      categoryId,
      visibility,
      commissionId,
    });
  }

  @Get('public/categories')
  publicCategories() {
    return this.documentsService.findCategories(null).then((data) => ({ data }));
  }

  @Get('public')
  publicList(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.documentsService.findAll(null, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      q,
      categoryId,
      visibility: DocumentVisibility.PUBLIC,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.MEMBER)
  detail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.documentsService.findById(user, id).then((data) => ({ data }));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, CsrfGuard)
  @Roles(RoleCode.MEMBER)
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateDocumentDto,
    @Req() req: Request,
  ) {
    return this.documentsService
      .create(user, dto, req.ip)
      .then((data) => ({ data }));
  }

  @Post(':id/download')
  @UseGuards(JwtAuthGuard, RolesGuard, CsrfGuard)
  @Roles(RoleCode.MEMBER)
  download(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.documentsService
      .recordDownload(user, id, req.ip)
      .then((data) => ({ data }));
  }
}
