import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';

@Module({
  imports: [RealtimeModule],
  controllers: [ModerationController],
  providers: [ModerationService],
})
export class ModerationModule {}
