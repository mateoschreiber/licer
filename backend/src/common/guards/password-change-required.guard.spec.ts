import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PasswordChangeRequiredGuard } from './password-change-required.guard';

function contextWith(user: { mustChangePassword?: boolean }) {
  return {
    getHandler: () => null,
    getClass: () => null,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('PasswordChangeRequiredGuard', () => {
  it('blocks protected operations while the initial password is active', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    } as unknown as Reflector;
    const guard = new PasswordChangeRequiredGuard(reflector);

    expect(() => guard.canActivate(contextWith({ mustChangePassword: true }))).toThrow(
      ForbiddenException,
    );
  });

  it('allows normal access after the password is changed', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    } as unknown as Reflector;
    const guard = new PasswordChangeRequiredGuard(reflector);

    expect(guard.canActivate(contextWith({ mustChangePassword: false }))).toBe(true);
  });
});
