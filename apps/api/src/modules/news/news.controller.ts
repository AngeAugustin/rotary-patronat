import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('category') category?: string,
  ) {
    return this.newsService.findPublished({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 12,
      q,
      category,
    });
  }

  @Get('categories/list')
  categories() {
    return this.newsService.findCategories().then((data) => ({ data }));
  }

  @Get(':slug')
  async detail(@Param('slug') slug: string) {
    const article = await this.newsService.findBySlug(slug);
    if (!article) {
      throw new NotFoundException({
        error: { code: 'NEWS_NOT_FOUND', message: 'Actualité introuvable' },
      });
    }
    return { data: article };
  }
}
