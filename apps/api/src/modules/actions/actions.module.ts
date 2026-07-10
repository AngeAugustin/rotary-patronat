import { Module } from '@nestjs/common';
import { ActionsController } from './actions.controller';
import { ActionsAdminController } from './actions-admin.controller';
import { ActionsService } from './actions.service';

@Module({
  controllers: [ActionsController, ActionsAdminController],
  providers: [ActionsService],
  exports: [ActionsService],
})
export class ActionsModule {}
