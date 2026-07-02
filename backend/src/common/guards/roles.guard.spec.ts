import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function createContext(roles: string[]): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user: { roles } }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('allows ADMIN even when the route asks for another internal role', () => {
    const reflector = {
      getAllAndOverride: jest.fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(['COMPRAS']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext(['ADMIN']))).toBe(true);
  });
});
