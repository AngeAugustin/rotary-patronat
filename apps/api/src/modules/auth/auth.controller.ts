import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetOtpDto } from './dto/verify-reset-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../../common/guards/roles.guard';
import { CsrfGuard, generateCsrfToken, signCsrfToken } from '../../common/guards/csrf.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '@rotary/shared-types';
import { EnvConfig } from '../../config/env.validation';

const REFRESH_COOKIE = 'refresh_token';
const CSRF_COOKIE = 'csrf-token';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService<EnvConfig, true>,
  ) {}

  @Get('csrf')
  getCsrf(@Res({ passthrough: true }) res: Response) {
    const token = generateCsrfToken();
    const secret = this.configService.get('CSRF_SECRET', { infer: true });
    const signed = signCsrfToken(token, secret);

    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: this.configService.get('NODE_ENV', { infer: true }) === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return { data: { csrfToken: signed } };
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @UseGuards(CsrfGuard)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(
      dto.email,
      dto.password,
      req.ip,
    );

    this.setRefreshCookie(res, result.refreshToken);

    return {
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    };
  }

  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @UseGuards(CsrfGuard)
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    const result = await this.authService.requestPasswordReset(dto.email, req.ip);
    return { data: result };
  }

  @Post('verify-reset-otp')
  @HttpCode(200)
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @UseGuards(CsrfGuard)
  async verifyResetOtp(@Body() dto: VerifyResetOtpDto) {
    const result = await this.authService.verifyResetOtp(dto.email, dto.code);
    return { data: result };
  }

  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @UseGuards(CsrfGuard)
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    const result = await this.authService.resetPassword(
      dto.resetToken,
      dto.password,
      dto.confirmPassword,
      req.ip,
    );
    return { data: result };
  }

  @Post('refresh')
  @HttpCode(200)
  @Throttle({ auth: { limit: 20, ttl: 60_000 } })
  @UseGuards(CsrfGuard)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException('Session expirée');
    }

    const result = await this.authService.refresh(refreshToken);
    this.setRefreshCookie(res, result.refreshToken);

    return {
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    };
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, CsrfGuard)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user?: AuthUser,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    await this.authService.logout(refreshToken, user?.id);

    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    res.clearCookie(CSRF_COOKIE, { path: '/' });

    return { data: { success: true } };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return { data: user };
  }

  private setRefreshCookie(res: Response, token: string) {
    const expiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN', { infer: true });
    const maxAge = this.parseMaxAge(expiresIn);

    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV', { infer: true }) === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge,
    });
  }

  private parseMaxAge(value: string): number {
    const match = value.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000;

    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return amount * (multipliers[unit] ?? multipliers.d);
  }
}
