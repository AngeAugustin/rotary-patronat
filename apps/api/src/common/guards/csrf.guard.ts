import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { Request } from 'express';
import { EnvConfig } from '../../config/env.validation';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly configService: ConfigService<EnvConfig, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (SAFE_METHODS.has(request.method)) {
      return true;
    }

    const csrfCookie = request.cookies?.['csrf-token'] as string | undefined;
    const csrfHeader = request.headers['x-csrf-token'] as string | undefined;

    if (!csrfCookie || !csrfHeader) {
      throw new ForbiddenException({
        error: { code: 'CSRF_MISSING', message: 'Jeton CSRF manquant' },
      });
    }

    const secret = this.configService.get('CSRF_SECRET', { infer: true });
    const expected = this.signToken(csrfCookie, secret);

    const headerBuffer = Buffer.from(csrfHeader);
    const expectedBuffer = Buffer.from(expected);

    if (
      headerBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(headerBuffer, expectedBuffer)
    ) {
      throw new ForbiddenException({
        error: { code: 'CSRF_INVALID', message: 'Jeton CSRF invalide' },
      });
    }

    return true;
  }

  private signToken(token: string, secret: string): string {
    return createHmac('sha256', secret).update(token).digest('hex');
  }
}

export function generateCsrfToken(): string {
  return createHmac('sha256', 'csrf-init')
    .update(`${Date.now()}-${Math.random()}`)
    .digest('hex');
}

export function signCsrfToken(token: string, secret: string): string {
  return createHmac('sha256', secret).update(token).digest('hex');
}
