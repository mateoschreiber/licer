import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { RequestWithUser } from '../auth/request-with-user.interface';
import { ROLES } from '../constants/roles';

@Injectable()
export class SupplierOwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user?.roles.includes(ROLES.PROVEEDOR)) {
      return true;
    }

    const requestedSupplierId =
      request.params.supplierId ?? request.params.id ?? request.body?.supplierId;

    if (!requestedSupplierId || requestedSupplierId !== user.supplierId) {
      throw new ForbiddenException('Supplier ownership mismatch');
    }

    return true;
  }
}
