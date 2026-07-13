import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomInt } from 'crypto';
import * as argon2 from 'argon2';
import { EnvConfig } from '../../config/env.validation';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LogsService } from '../logs/logs.service';
import { MailService } from '../mail/mail.service';
import { AuthUser } from '@rotary/shared-types';

interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}

interface PasswordResetJwtPayload {
  sub: string;
  purpose: 'password_reset';
}

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_EXPIRES_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const RESET_TOKEN_EXPIRES_IN = '15m';
const GENERIC_FORGOT_MESSAGE =
  'Si un compte est associé à cette adresse, un code de vérification vient de vous être envoyé.';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly logsService: LogsService,
    private readonly mailService: MailService,
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

  async requestPasswordReset(email: string, ipAddress?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (user?.isActive) {
      const code = String(randomInt(100_000, 1_000_000));
      const codeHash = this.hashToken(code);
      const expiresAt = new Date(Date.now() + OTP_TTL_MS);

      await this.prisma.passwordResetOtp.updateMany({
        where: { userId: user.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });

      await this.prisma.passwordResetOtp.create({
        data: {
          userId: user.id,
          codeHash,
          expiresAt,
        },
      });

      await this.mailService.sendPasswordResetOtp({
        to: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        code,
        expiresInMinutes: OTP_EXPIRES_MINUTES,
      });

      await this.logsService.logActivity({
        userId: user.id,
        action: 'PASSWORD_RESET_REQUEST',
        resource: 'auth',
        ipAddress,
      });
    }

    return { message: GENERIC_FORGOT_MESSAGE };
  }

  async verifyResetOtp(email: string, code: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user?.isActive) {
      throw new BadRequestException({
        error: {
          code: 'INVALID_OTP',
          message: 'Code invalide ou expiré',
        },
      });
    }

    const otp = await this.prisma.passwordResetOtp.findFirst({
      where: {
        userId: user.id,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp || otp.expiresAt < new Date()) {
      throw new BadRequestException({
        error: {
          code: 'INVALID_OTP',
          message: 'Code invalide ou expiré',
        },
      });
    }

    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      await this.prisma.passwordResetOtp.update({
        where: { id: otp.id },
        data: { consumedAt: new Date() },
      });
      throw new BadRequestException({
        error: {
          code: 'OTP_MAX_ATTEMPTS',
          message: 'Trop de tentatives. Demandez un nouveau code.',
        },
      });
    }

    const codeHash = this.hashToken(code.trim());
    if (codeHash !== otp.codeHash) {
      await this.prisma.passwordResetOtp.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException({
        error: {
          code: 'INVALID_OTP',
          message: 'Code invalide ou expiré',
        },
      });
    }

    await this.prisma.passwordResetOtp.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });

    const resetToken = await this.jwtService.signAsync(
      { sub: user.id, purpose: 'password_reset' } satisfies PasswordResetJwtPayload,
      {
        secret: this.configService.get('JWT_ACCESS_SECRET', { infer: true }),
        expiresIn: RESET_TOKEN_EXPIRES_IN,
      },
    );

    return { resetToken };
  }

  async resetPassword(
    resetToken: string,
    password: string,
    confirmPassword: string,
    ipAddress?: string,
  ) {
    if (password !== confirmPassword) {
      throw new BadRequestException({
        error: {
          code: 'PASSWORD_MISMATCH',
          message: 'Les mots de passe ne correspondent pas',
        },
      });
    }

    if (password.length < 8) {
      throw new BadRequestException({
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Le mot de passe doit contenir au moins 8 caractères',
        },
      });
    }

    let payload: PasswordResetJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<PasswordResetJwtPayload>(resetToken, {
        secret: this.configService.get('JWT_ACCESS_SECRET', { infer: true }),
      });
    } catch {
      throw new BadRequestException({
        error: {
          code: 'INVALID_RESET_TOKEN',
          message: 'Lien de réinitialisation invalide ou expiré',
        },
      });
    }

    if (payload.purpose !== 'password_reset' || !payload.sub) {
      throw new BadRequestException({
        error: {
          code: 'INVALID_RESET_TOKEN',
          message: 'Lien de réinitialisation invalide ou expiré',
        },
      });
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user?.isActive) {
      throw new BadRequestException({
        error: {
          code: 'INVALID_RESET_TOKEN',
          message: 'Lien de réinitialisation invalide ou expiré',
        },
      });
    }

    const passwordHash = await argon2.hash(password);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
      this.prisma.passwordResetOtp.updateMany({
        where: { userId: user.id, consumedAt: null },
        data: { consumedAt: new Date() },
      }),
    ]);

    await this.logsService.logActivity({
      userId: user.id,
      action: 'PASSWORD_RESET',
      resource: 'auth',
      ipAddress,
    });

    return { success: true };
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
