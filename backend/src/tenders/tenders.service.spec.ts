import { BadRequestException } from '@nestjs/common';
import { AuthenticatedUser } from '../common/auth/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { TendersService } from './tenders.service';

const adminUser: AuthenticatedUser = {
  id: 'admin-1',
  email: 'admin@test',
  name: 'Admin',
  supplierId: null,
  roles: ['ADMIN'],
  permissions: [],
};

function createService(prisma: unknown) {
  return new TendersService(prisma as PrismaService);
}

describe('TendersService date defaults', () => {
  it('uses the editable base date to default consultation and bid deadlines', async () => {
    const prisma = {
      tender: {
        create: jest.fn().mockImplementation(({ data }) => data),
      },
    };
    const service = createService(prisma);

    const tender = await service.create(
      {
        code: 'LIC-001',
        title: 'Compra equipos',
        description: 'Compra de equipos',
        publishedAt: '2026-07-02T10:00:00.000Z',
      },
      adminUser,
    );

    expect(tender.questionDeadline?.toISOString()).toBe('2026-07-18T02:59:59.999Z');
    expect(tender.bidDeadline.toISOString()).toBe('2026-08-02T02:59:59.999Z');
  });

  it('rejects bid deadlines before consultation deadlines', async () => {
    const service = createService({ tender: { create: jest.fn() } });

    await expect(
      service.create(
        {
          code: 'LIC-002',
          title: 'Compra equipos',
          description: 'Compra de equipos',
          publishedAt: '2026-07-02T10:00:00.000Z',
          questionDeadline: '2026-07-20T10:00:00.000Z',
          bidDeadline: '2026-07-10T10:00:00.000Z',
        },
        adminUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
