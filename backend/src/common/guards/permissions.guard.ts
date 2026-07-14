import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestWithUser } from '../auth/request-with-user.interface';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions?.length) {
      throw new ForbiddenException('Falta la configuración de permisos');
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userRoles = request.user?.roles ?? [];

    if (userRoles.includes('ADMIN')) {
      return true;
    }

    const userPermissions = request.user?.permissions ?? [];
    const allowed = requiredPermissions.some((permission) => userPermissions.includes(permission));

    if (!allowed) {
      throw new ForbiddenException('Permiso denegado');
    }

    return true;
  }
}
