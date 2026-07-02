import { RequestingAreasService } from './requesting-areas.service';
import { PrismaService } from '../prisma/prisma.service';

function createService(prisma: unknown) {
  return new RequestingAreasService(prisma as PrismaService);
}

describe('RequestingAreasService code generation', () => {
  it('generates a code from the area name and ignores client supplied code on create', async () => {
    const prisma = {
      requestingArea: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation(({ data }) => data),
      },
    };
    const service = createService(prisma);

    const area = await service.create({
      code: 'MANUAL',
      name: 'Logistica',
      description: 'Area de logistica',
    });

    expect(area.code).toBe('LOG');
    expect(prisma.requestingArea.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ code: 'LOG' }),
      }),
    );
  });

  it('keeps the generated code unique by following the existing sequence', async () => {
    const prisma = {
      requestingArea: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([
          { code: 'ADM' },
          { code: 'ADM-02' },
        ]),
        create: jest.fn().mockImplementation(({ data }) => data),
      },
    };
    const service = createService(prisma);

    const area = await service.create({
      name: 'Administracion tecnica',
    });

    expect(area.code).toBe('ADM-03');
  });
});
