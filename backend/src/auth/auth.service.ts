import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../common/auth/authenticated-user.interface';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async login(dto: LoginDto, ip?: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    const passwordValid =
      user && (await bcrypt.compare(dto.password, user.passwordHash));

    if (!user || !passwordValid || user.status !== 'ACTIVE') {
      await this.auditService.log({
        action: 'LOGIN_FAILED',
        entity: 'User',
        entityId: user?.id,
        result: 'DENIED',
        ip,
        metadata: { email: dto.email },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const roles = user.roles.map((userRole) => userRole.role.name);
    const permissions = [
      ...new Set(
        user.roles.flatMap((userRole) =>
          userRole.role.permissions.map(
            (rolePermission) => rolePermission.permission.code,
          ),
        ),
      ),
    ];

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        failedLoginCount: 0,
      },
    });

    await this.auditService.log({
      actorId: user.id,
      role: roles[0],
      action: 'LOGIN_SUCCESS',
      entity: 'User',
      entityId: user.id,
      result: 'ALLOWED',
      ip,
    });

    const payload = { sub: user.id };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      refreshToken: await this.jwtService.signAsync(payload, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ??
          'change-me-refresh-secret',
        expiresIn:
          this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
      }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        supplierId: user.supplierId,
        roles,
        permissions,
      },
    };
  }

  setRefreshCookie(response: Response, refreshToken: string) {
    const secure = this.configService.get<string>('COOKIE_SECURE') === 'true';
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/api/v1/auth/refresh',
    });
  }

  logout(response: Response, user?: AuthenticatedUser) {
    response.clearCookie('refresh_token', {
      path: '/api/v1/auth/refresh',
    });

    if (user) {
      void this.auditService.log({
        actorId: user.id,
        role: user.roles[0],
        action: 'LOGOUT',
        entity: 'User',
        entityId: user.id,
        result: 'ALLOWED',
      });
    }

    return { ok: true };
  }

  async refresh(refreshToken?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }

    const payload = await this.jwtService.verifyAsync<{ sub: string }>(
      refreshToken,
      {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ??
          'change-me-refresh-secret',
      },
    );

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null, status: 'ACTIVE' },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const roles = user.roles.map((userRole) => userRole.role.name);
    const permissions = [
      ...new Set(
        user.roles.flatMap((userRole) =>
          userRole.role.permissions.map(
            (rolePermission) => rolePermission.permission.code,
          ),
        ),
      ),
    ];

    return {
      accessToken: await this.jwtService.signAsync({ sub: user.id }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        supplierId: user.supplierId,
        roles,
        permissions,
      },
    };
  }

  requestPasswordReset(email: string) {
    return {
      ok: true,
      message: `If ${email} exists, a reset token will be sent.`,
    };
  }

  confirmPasswordReset() {
    return {
      ok: true,
      message: 'Password reset flow is ready for token storage integration.',
    };
  }
}
