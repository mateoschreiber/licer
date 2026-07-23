import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthSecurityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async assertAllowed(kind: 'login' | 'reset', ip?: string) {
    const key = `${kind}:${ip?.trim() || 'unknown'}`;
    const attempt = await this.prisma.securityAttempt.findUnique({ where: { key } });
    if (attempt?.blockedUntil && attempt.blockedUntil > new Date()) {
      throw new HttpException(
        'Demasiados intentos. Intente nuevamente más tarde.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async recordFailure(kind: 'login' | 'reset', ip?: string) {
    const key = `${kind}:${ip?.trim() || 'unknown'}`;
    const now = new Date();
    const windowMs = this.getNumber('AUTH_RATE_LIMIT_WINDOW_SECONDS', 600, 60) * 1000;
    const maxAttempts = this.getNumber('AUTH_RATE_LIMIT_MAX_ATTEMPTS', 20, 1);
    const existing = await this.prisma.securityAttempt.findUnique({ where: { key } });

    if (!existing || existing.windowStartedAt.getTime() <= now.getTime() - windowMs) {
      await this.prisma.securityAttempt.upsert({
        where: { key },
        create: { key, count: 1, windowStartedAt: now },
        update: { count: 1, windowStartedAt: now, blockedUntil: null },
      });
      return;
    }

    const count = existing.count + 1;
    await this.prisma.securityAttempt.update({
      where: { key },
      data: {
        count,
        blockedUntil: count >= maxAttempts ? new Date(now.getTime() + windowMs) : null,
      },
    });
  }

  async clear(kind: 'login' | 'reset', ip?: string) {
    const key = `${kind}:${ip?.trim() || 'unknown'}`;
    await this.prisma.securityAttempt.deleteMany({ where: { key } });
  }

  getAccountLockDurationMs() {
    return this.getNumber('AUTH_ACCOUNT_LOCK_SECONDS', 900, 60) * 1000;
  }

  private getNumber(name: string, fallback: number, minimum: number) {
    const value = Number(this.config.get<string>(name) ?? fallback);
    return Number.isFinite(value) && value >= minimum ? value : fallback;
  }
}
