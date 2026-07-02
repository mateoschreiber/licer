import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { AuditService } from '../../audit/audit.service';
import {
  AUDIT_ACTION_KEY,
  AuditActionMetadata,
} from '../decorators/audit-action.decorator';
import { RequestWithUser } from '../auth/request-with-user.interface';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const metadata = this.reflector.getAllAndOverride<AuditActionMetadata>(
      AUDIT_ACTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!metadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const entityId =
      request.params.id ??
      request.params.tenderId ??
      request.body?.id ??
      request.body?.tenderId;

    return next.handle().pipe(
      tap(() => {
        void this.auditService.log({
          actorId: request.user?.id,
          role: request.user?.roles[0],
          ip: request.ip,
          action: metadata.action,
          entity: metadata.entity,
          entityId,
          result: 'ALLOWED',
          metadata: { method: request.method, path: request.path },
        });
      }),
      catchError((error: unknown) => {
        void this.auditService.log({
          actorId: request.user?.id,
          role: request.user?.roles[0],
          ip: request.ip,
          action: metadata.action,
          entity: metadata.entity,
          entityId,
          result: 'ERROR',
          metadata: { method: request.method, path: request.path },
        });
        return throwError(() => error);
      }),
    );
  }
}
