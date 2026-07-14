import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestWithUser } from '../auth/request-with-user.interface';
import { ALLOW_BEFORE_PASSWORD_CHANGE_KEY } from '../decorators/allow-before-password-change.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class PasswordChangeRequiredGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets);
    const isAllowed = this.reflector.getAllAndOverride<boolean>(
      ALLOW_BEFORE_PASSWORD_CHANGE_KEY,
      targets,
    );
    if (isPublic || isAllowed) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (request.user?.mustChangePassword) {
      throw new ForbiddenException('Debe cambiar su contraseña antes de continuar');
    }
    return true;
  }
}
