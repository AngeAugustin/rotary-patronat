import { Module } from '@nestjs/common';
import { ClubController } from './club.controller';
import { ClubService } from './club.service';
import { ActionsModule } from '../actions/actions.module';
import { NewsModule } from '../news/news.module';

@Module({
  imports: [ActionsModule, NewsModule],
  controllers: [ClubController],
  providers: [ClubService],
  exports: [ClubService],
})
export class ClubModule {}
