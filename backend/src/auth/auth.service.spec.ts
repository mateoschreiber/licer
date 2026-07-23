import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('replaces the initial password and clears the required-change flag', async () => {
    const currentHash = await bcrypt.hash('Initial123', 4);
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'user-1',
          passwordHash: currentHash,
          mustChangePassword: true,
        }),
        update: jest.fn().mockResolvedValue({ id: 'user-1' }),
      },
      authSession: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    const audit = { log: jest.fn().mockResolvedValue(undefined) };
    const security = { assertAllowed: jest.fn(), clear: jest.fn(), recordFailure: jest.fn() };
    const mailer = { isEnabled: jest.fn().mockReturnValue(false), send: jest.fn() };
    const service = new AuthService(
      prisma as never,
      {} as never,
      {} as never,
      audit as never,
      security as never,
      mailer as never,
    );

    await expect(
      service.changePassword(
        {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Usuario',
          supplierId: null,
          roles: ['ADMIN'],
          permissions: [],
        },
        { currentPassword: 'Initial123', newPassword: 'Secure456' },
      ),
    ).resolves.toEqual({ ok: true });

    const update = prisma.user.update.mock.calls[0][0];
    expect(update.data.mustChangePassword).toBe(false);
    await expect(bcrypt.compare('Secure456', update.data.passwordHash)).resolves.toBe(true);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PASSWORD_CHANGED', actorId: 'user-1' }),
    );
  });
});
