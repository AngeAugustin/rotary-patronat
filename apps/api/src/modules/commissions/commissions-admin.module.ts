import { Module } from '@nestjs/common';
import { CommissionsAdminController } from './commissions-admin.controller';
import { CommissionsAdminService } from './commissions-admin.service';

@Module({
  controllers: [CommissionsAdminController],
  providers: [CommissionsAdminService],
  exports: [CommissionsAdminService],
})
export class CommissionsAdminModule {}
