import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthUser } from '@rotary/shared-types';
import { JwtAuthGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProfileService } from './profile.service';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  me(@CurrentUser() user: AuthUser) {
    return this.profileService.getMyProfile(user.id).then((data) => ({ data }));
  }
}
