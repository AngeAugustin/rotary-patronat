import { Controller, Get, NotFoundException } from '@nestjs/common';
import { ClubService } from './club.service';
import { ActionsService } from '../actions/actions.service';
import { NewsService } from '../news/news.service';

@Controller('club')
export class ClubController {
  constructor(
    private readonly clubService: ClubService,
    private readonly actionsService: ActionsService,
    private readonly newsService: NewsService,
  ) {}

  @Get()
  async profile() {
    const profile = await this.clubService.getProfile();
    if (!profile) {
      throw new NotFoundException({
        error: { code: 'CLUB_NOT_FOUND', message: 'Profil du club introuvable' },
      });
    }
    return { data: profile };
  }

  @Get('homepage')
  async homepage() {
    const profile = await this.clubService.getProfile();
    const [featuredActions, recentNews, upcomingMeetings] = await Promise.all([
      this.actionsService.findFeatured(3),
      this.newsService.findRecent(4),
      this.clubService.getUpcomingMeetings(3),
    ]);

    return {
      data: {
        presidentMessage: profile?.presidentMessage ?? '',
        presidentName: profile?.presidentName ?? '',
        presidentTitle: profile?.presidentTitle ?? '',
        presidentPhoto: profile?.presidentPhoto ?? null,
        featuredActions,
        recentNews,
        upcomingMeetings,
        socialLinks: profile?.socialLinks ?? [],
      },
    };
  }
}
