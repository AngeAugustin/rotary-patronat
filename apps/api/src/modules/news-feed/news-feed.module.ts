import { Module } from '@nestjs/common';
import { PostsModule } from '../posts/posts.module';
import { NewsFeedController } from './news-feed.controller';

@Module({
  imports: [PostsModule],
  controllers: [NewsFeedController],
})
export class NewsFeedModule {}
