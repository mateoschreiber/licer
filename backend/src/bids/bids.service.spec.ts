import { ForbiddenException } from '@nestjs/common';
import { BidsService } from './bids.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/auth/authenticated-user.interface';

const supplierUser: AuthenticatedUser = {
  id: 'user-a',
  email: 'a@supplier.test',
  name: 'Supplier A',
  supplierId: 'supplier-a',
  roles: ['PROVEEDOR'],
  permissions: ['bids:read:own', 'bids:submit:own'],
};

const internalUser: AuthenticatedUser = {
  id: 'internal-1',
  email: 'buyer@test',
  name: 'Buyer',
  supplierId: null,
  roles: ['COMPRAS'],
  permissions: ['bids:read:internal'],
};

function createService(prisma: unknown, audit: unknown) {
  return new BidsService(prisma as PrismaService, audit as AuditService);
}

describe('BidsService security rules', () => {
  it('rejects Supplier A access to Supplier B bid', async () => {
    const audit = { log: jest.fn() };
    const prisma = {
      bid: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'bid-b',
          tenderId: 'tender-1',
          supplierId: 'supplier-b',
        }),
      },
    };
    const service = createService(prisma, audit);

    await expect(service.findOne('bid-b', supplierUser, '127.0.0.1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'BID_ACCESS_DENIED',
        result: 'DENIED',
      }),
    );
  });

  it('filters supplier bid listing by supplierId', async () => {
    const prisma = {
      bid: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = createService(prisma, { log: jest.fn() });

    await service.findAll({ page: 1, pageSize: 20 }, supplierUser);

    expect(prisma.bid.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ supplierId: 'supplier-a' }),
      }),
    );
  });

  it('rejects internal bid view without internal bid permission', async () => {
    const audit = { log: jest.fn() };
    const prisma = {
      bid: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'bid-1',
          tenderId: 'tender-1',
          supplierId: 'supplier-a',
        }),
      },
    };
    const userWithoutPermission: AuthenticatedUser = {
      ...internalUser,
      permissions: [],
    };
    const service = createService(prisma, audit);

    await expect(service.findOne('bid-1', userWithoutPermission)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects bid submission after deadline', async () => {
    const prisma = {
      bid: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'bid-1',
          supplierId: 'supplier-a',
          status: 'BORRADOR',
          supplier: { id: 'supplier-a', status: 'ACTIVO' },
          tender: {
            id: 'tender-1',
            bidDeadline: new Date(Date.now() - 60_000),
          },
        }),
      },
    };
    const service = createService(prisma, { log: jest.fn() });

    await expect(service.submit('bid-1', supplierUser)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('audits internal bid view immediately', async () => {
    const audit = { log: jest.fn() };
    const prisma = {
      bid: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'bid-1',
          tenderId: 'tender-1',
          supplierId: 'supplier-a',
        }),
      },
    };
    const service = createService(prisma, audit);

    await service.findOne('bid-1', internalUser, '127.0.0.1');

    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'BID_VIEW_INTERNAL',
        result: 'ALLOWED',
        entityId: 'bid-1',
      }),
    );
  });
});
