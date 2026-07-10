import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { MeetingsService } from './meetings.service';

@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('upcoming') upcoming?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.meetingsService.findPublished({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 12,
      upcoming:
        upcoming === 'true' ? true : upcoming === 'false' ? false : undefined,
      from,
      to,
    });
  }

  @Get(':slug')
  async detail(@Param('slug') slug: string) {
    const meeting = await this.meetingsService.findBySlug(slug);
    if (!meeting) {
      throw new NotFoundException({
        error: { code: 'MEETING_NOT_FOUND', message: 'Réunion introuvable' },
      });
    }
    return { data: meeting };
  }
}
