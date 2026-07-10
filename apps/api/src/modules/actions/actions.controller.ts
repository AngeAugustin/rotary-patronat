import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ActionsService } from './actions.service';

@Controller('actions')
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Get()
  list(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.actionsService.findPublished(
      page ? Number(page) : 1,
      limit ? Number(limit) : 12,
    );
  }

  @Get(':slug')
  async detail(@Param('slug') slug: string) {
    const action = await this.actionsService.findBySlug(slug);
    if (!action) {
      throw new NotFoundException({
        error: { code: 'ACTION_NOT_FOUND', message: 'Action introuvable' },
      });
    }
    return { data: action };
  }
}
