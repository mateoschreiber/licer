import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Response } from 'express';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../common/auth/authenticated-user.interface';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordConfirmDto } from './dto/reset-password.dto';
import { AuthSecurityService } from './auth-security.service';
import { PasswordResetMailerService } from './password-reset-mailer.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly securityService: AuthSecurityService,
    private readonly passwordResetMailer: PasswordResetMailerService,
  ) {}

  async login(dto: LoginDto, ip?: string) {
    await this.securityService.assertAllowed('login', ip);
    const user = await this.prisma.user.findFirst({
      where: { deletedAt: null, OR: [{ email: dto.email }, { username: dto.email }] },
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

    const now = new Date();
    const passwordValid = user && (await bcrypt.compare(dto.password, user.passwordHash));

    if (
      !user ||
      !passwordValid ||
      user.status !== 'ACTIVE' ||
      (user.lockedUntil !== null && user.lockedUntil > now)
    ) {
      if (user && passwordValid === false && user.status === 'ACTIVE') {
        const updated = await this.prisma.user.update({
          where: { id: user.id },
          data: { failedLoginCount: { increment: 1 } },
          select: { failedLoginCount: true },
        });
        if (updated.failedLoginCount >= 5) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginCount: 0,
              lockedUntil: new Date(
                now.getTime() + this.securityService.getAccountLockDurationMs(),
              ),
            },
          });
        }
      }
      await this.securityService.recordFailure('login', ip);
      await this.auditService.log({
        action: 'LOGIN_FAILED',
        entity: 'User',
        entityId: user?.id,
        result: 'DENIED',
        ip,
        metadata: { email: dto.email },
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const roles = user.roles.map((userRole) => userRole.role.name);
    const permissions = [
      ...new Set(
        user.roles.flatMap((userRole) =>
          userRole.role.permissions.map((rolePermission) => rolePermission.permission.code),
        ),
      ),
    ];

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });
    await this.securityService.clear('login', ip);

    await this.auditService.log({
      actorId: user.id,
      role: roles[0],
      action: 'LOGIN_SUCCESS',
      entity: 'User',
      entityId: user.id,
      result: 'ALLOWED',
      ip,
    });

    const refreshToken = await this.createRefreshToken(user.id);
    return {
      accessToken: await this.jwtService.signAsync({ sub: user.id }),
      refreshToken,
      user: this.toSessionUser(user, roles, permissions),
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

  async logout(response: Response, refreshToken?: string, user?: AuthenticatedUser) {
    response.clearCookie('refresh_token', {
      path: '/api/v1/auth/refresh',
    });

    if (user) {
      await this.revokeRefreshToken(refreshToken);
      await this.auditService.log({
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

  async changePassword(user: AuthenticatedUser, dto: ChangePasswordDto) {
    const account = await this.prisma.user.findFirst({
      where: { id: user.id, deletedAt: null, status: 'ACTIVE' },
    });
    if (!account || !(await bcrypt.compare(dto.currentPassword, account.passwordHash))) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }
    if (await bcrypt.compare(dto.newPassword, account.passwordHash)) {
      throw new BadRequestException('La nueva contraseña debe ser diferente de la actual');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: account.id },
        data: {
          passwordHash: await bcrypt.hash(dto.newPassword, 12),
          mustChangePassword: false,
        },
      }),
      this.prisma.authSession.updateMany({
        where: { userId: account.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    await this.auditService.log({
      actorId: account.id,
      role: user.roles[0],
      action: 'PASSWORD_CHANGED',
      entity: 'User',
      entityId: account.id,
      result: 'ALLOWED',
    });
    return { ok: true };
  }

  async refresh(refreshToken?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Se requiere el token de actualización');
    }

    const payload = await this.jwtService.verifyAsync<{ sub: string; jti?: string; type?: string }>(
      refreshToken,
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      },
    );
    if (payload.type !== 'refresh' || !payload.jti) {
      throw new UnauthorizedException('Token de actualización inválido');
    }

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
      throw new UnauthorizedException('Token de actualización inválido');
    }

    const now = new Date();
    const revoked = await this.prisma.authSession.updateMany({
      where: {
        id: payload.jti,
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: { gt: now },
        revokedAt: null,
      },
      data: { revokedAt: now, lastUsedAt: now },
    });
    if (revoked.count !== 1) {
      throw new UnauthorizedException('Token de actualización inválido');
    }

    const roles = user.roles.map((userRole) => userRole.role.name);
    const permissions = [
      ...new Set(
        user.roles.flatMap((userRole) =>
          userRole.role.permissions.map((rolePermission) => rolePermission.permission.code),
        ),
      ),
    ];

    return {
      accessToken: await this.jwtService.signAsync({ sub: user.id }),
      refreshToken: await this.createRefreshToken(user.id),
      user: this.toSessionUser(user, roles, permissions),
    };
  }

  async requestPasswordReset(email: string, ip?: string) {
    await this.securityService.assertAllowed('reset', ip);
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null, status: 'ACTIVE' },
      select: { id: true, email: true },
    });
    if (!this.passwordResetMailer.isEnabled()) {
      return this.resetRequestResponse();
    }
    if (!user) {
      await this.securityService.recordFailure('reset', ip);
      return this.resetRequestResponse();
    }

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + this.getResetExpiryMs());
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id, consumedAt: null } }),
      this.prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash: this.hashToken(token), expiresAt },
      }),
    ]);

    try {
      await this.passwordResetMailer.send(user.email, token);
      await this.securityService.clear('reset', ip);
      await this.auditService.log({
        actorId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        entity: 'User',
        entityId: user.id,
        result: 'ALLOWED',
        ip,
      });
    } catch {
      await this.prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, consumedAt: null },
      });
      await this.auditService.log({
        actorId: user.id,
        action: 'PASSWORD_RESET_DELIVERY_FAILED',
        entity: 'User',
        entityId: user.id,
        result: 'ERROR',
        ip,
      });
    }

    return this.resetRequestResponse();
  }

  async confirmPasswordReset(dto: ResetPasswordConfirmDto, ip?: string) {
    const now = new Date();
    const reset = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash: this.hashToken(dto.token), consumedAt: null, expiresAt: { gt: now } },
      select: { id: true, userId: true },
    });
    if (!reset) {
      throw new UnauthorizedException('El enlace de restablecimiento es inválido o venció');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash: await bcrypt.hash(dto.password, 12), mustChangePassword: false },
      }),
      this.prisma.passwordResetToken.update({ where: { id: reset.id }, data: { consumedAt: now } }),
      this.prisma.authSession.updateMany({
        where: { userId: reset.userId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);
    await this.auditService.log({
      actorId: reset.userId,
      action: 'PASSWORD_RESET_COMPLETED',
      entity: 'User',
      entityId: reset.userId,
      result: 'ALLOWED',
      ip,
    });
    return { ok: true };
  }

  private resetRequestResponse() {
    return {
      ok: true,
      message: 'Si la cuenta existe, recibirá las instrucciones en su correo.',
    };
  }

  private async createRefreshToken(userId: string) {
    const id = randomUUID();
    const token = await this.jwtService.signAsync(
      { sub: userId, jti: id, type: 'refresh' },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
      },
    );
    const payload = this.jwtService.decode(token) as { exp?: number } | null;
    if (!payload?.exp)
      throw new Error('No se pudo calcular la expiración del token de actualización');
    await this.prisma.authSession.create({
      data: {
        id,
        userId,
        tokenHash: this.hashToken(token),
        expiresAt: new Date(payload.exp * 1000),
      },
    });
    return token;
  }

  private async revokeRefreshToken(token?: string) {
    if (!token) return;
    await this.prisma.authSession.updateMany({
      where: { tokenHash: this.hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private hashToken(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  private getResetExpiryMs() {
    const minutes = Number(this.configService.get<string>('PASSWORD_RESET_TTL_MINUTES') ?? 30);
    return Number.isFinite(minutes) && minutes >= 5 ? minutes * 60_000 : 30 * 60_000;
  }

  private toSessionUser(
    user: {
      id: string;
      email: string;
      name: string;
      lastName: string | null;
      mustChangePassword: boolean;
      supplierId: string | null;
    },
    roles: string[],
    permissions: string[],
  ) {
    return { ...user, roles, permissions };
  }
}
