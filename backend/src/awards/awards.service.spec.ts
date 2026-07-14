import { BadRequestException } from '@nestjs/common';
import { AuthenticatedUser } from '../common/auth/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { AwardsService } from './awards.service';

const adminUser: AuthenticatedUser = {
  id: 'admin-1',
  email: 'admin@test',
  name: 'Admin',
  supplierId: null,
  roles: ['ADMIN'],
  permissions: [],
};

function createService(prisma: unknown) {
  return new AwardsService(prisma as PrismaService);
}

describe('AwardsService resolve and validation', () => {
  it('returns multiple supplier options for ambiguous supplier names', async () => {
    const prisma = {
      bid: { findFirst: jest.fn().mockResolvedValue(null) },
      tender: { findFirst: jest.fn().mockResolvedValue(null) },
      supplier: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'sup-1',
            ruc: '8001',
            legalName: 'Proveedor Uno',
            tradeName: null,
            status: 'ACTIVO',
          },
          {
            id: 'sup-2',
            ruc: '8002',
            legalName: 'Proveedor Dos',
            tradeName: null,
            status: 'ACTIVO',
          },
        ]),
      },
    };
    const service = createService(prisma);

    await expect(service.resolve('Proveedor')).resolves.toEqual(
      expect.objectContaining({
        mode: 'multiple',
        matchedBy: 'supplierName',
        options: expect.arrayContaining([
          expect.objectContaining({ id: 'sup-1' }),
          expect.objectContaining({ id: 'sup-2' }),
        ]),
      }),
    );
  });

  it('rejects awards when the bid belongs to a different supplier', async () => {
    const prisma = {
      tender: { findFirst: jest.fn().mockResolvedValue({ id: 'tender-1' }) },
      supplier: { findFirst: jest.fn().mockResolvedValue({ id: 'supplier-1' }) },
      bid: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'bid-1',
          tenderId: 'tender-1',
          supplierId: 'supplier-2',
          totalAmount: 100,
        }),
      },
    };
    const service = createService(prisma);

    await expect(
      service.award(
        {
          tenderId: 'tender-1',
          supplierId: 'supplier-1',
          bidId: 'bid-1',
          reason: 'Mejor oferta tecnica',
        },
        adminUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
