import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import * as argon2 from 'argon2';
import { EnvConfig } from '../../config/env.validation';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LogsService } from '../logs/logs.service';
import { AuthUser } from '@rotary/shared-types';

interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly logsService: LogsService,
  ) {}

  async login(email: string, password: string, ipAddress?: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        error: { code: 'INVALID_CREDENTIALS', message: 'Identifiants invalides' },
      });
    }

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      throw new UnauthorizedException({
        error: { code: 'INVALID_CREDENTIALS', message: 'Identifiants invalides' },
      });
    }

    const authUser = this.usersService.mapToAuthUser(user);
    const accessToken = await this.createAccessToken(authUser);
    const refreshToken = await this.createRefreshToken(user.id);

    await this.logsService.logActivity({
      userId: user.id,
      action: 'LOGIN',
      resource: 'auth',
      ipAddress,
    });

    return { accessToken, refreshToken, user: authUser };
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { roles: { include: { role: true } } } } },
    });

    if (!stored || stored.expiresAt < new Date() || !stored.user.isActive) {
      throw new UnauthorizedException({
        error: { code: 'INVALID_REFRESH', message: 'Session expirée' },
      });
    }

    const authUser = this.usersService.mapToAuthUser(stored.user);
    const accessToken = await this.createAccessToken(authUser);
    const newRefreshToken = await this.rotateRefreshToken(stored.id, stored.userId);

    return { accessToken, refreshToken: newRefreshToken, user: authUser };
  }

  async logout(refreshToken: string | undefined, userId?: string) {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
    }

    if (userId) {
      await this.logsService.logActivity({
        userId,
        action: 'LOGOUT',
        resource: 'auth',
      });
    }
  }

  async validateUser(userId: string): Promise<AuthUser | null> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.isActive) {
      return null;
    }
    return this.usersService.mapToAuthUser(user);
  }

  private async createAccessToken(user: AuthUser) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET', { infer: true }),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', { infer: true }),
    });
  }

  private async createRefreshToken(userId: string) {
    const rawToken = randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN', { infer: true });
    const expiresAt = this.parseExpiry(expiresIn);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return rawToken;
  }

  private async rotateRefreshToken(oldTokenId: string, userId: string) {
    await this.prisma.refreshToken.delete({ where: { id: oldTokenId } });
    return this.createRefreshToken(userId);
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseExpiry(value: string): Date {
    const match = value.match(/^(\d+)([smhd])$/);
    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + amount * (multipliers[unit] ?? multipliers.d));
  }
}
