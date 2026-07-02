import { ForbiddenException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../common/auth/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from './files.service';

const supplierUser: AuthenticatedUser = {
  id: 'user-a',
  email: 'a@supplier.test',
  name: 'Supplier A',
  supplierId: 'supplier-a',
  roles: ['PROVEEDOR'],
  permissions: ['files:download:own'],
};

const internalUser: AuthenticatedUser = {
  id: 'internal-1',
  email: 'buyer@test',
  name: 'Buyer',
  supplierId: null,
  roles: ['COMPRAS'],
  permissions: ['files:download:internal'],
};

function createService(prisma: unknown, audit: unknown) {
  return new FilesService(prisma as PrismaService, audit as AuditService);
}

describe('FilesService security rules', () => {
  it('rejects supplier download of another supplier bid file', async () => {
    const audit = { log: jest.fn() };
    const prisma = {
      fileObject: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'file-1',
          uploadedById: 'other-user',
          storagePath: './storage/private/file-1.pdf',
          originalName: 'offer.pdf',
          mime: 'application/pdf',
          size: BigInt(100),
          supplierDocuments: [],
          tenderDocuments: [],
          bidDocuments: [
            {
              id: 'bid-doc-1',
              bidId: 'bid-1',
              voidedAt: null,
              bid: {
                id: 'bid-1',
                supplierId: 'supplier-b',
                tenderId: 'tender-1',
              },
            },
          ],
        }),
      },
    };
    const service = createService(prisma, audit);

    await expect(service.prepareDownload('file-1', supplierUser)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'FILE_DOWNLOAD_DENIED',
        result: 'DENIED',
      }),
    );
  });

  it('audits internal download of bid document before returning descriptor', async () => {
    const audit = { log: jest.fn() };
    const prisma = {
      fileObject: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'file-1',
          uploadedById: 'supplier-user',
          storagePath: './storage/private/file-1.pdf',
          originalName: 'offer.pdf',
          mime: 'application/pdf',
          size: BigInt(100),
          supplierDocuments: [],
          tenderDocuments: [],
          bidDocuments: [
            {
              id: 'bid-doc-1',
              bidId: 'bid-1',
              voidedAt: null,
              bid: {
                id: 'bid-1',
                supplierId: 'supplier-a',
                tenderId: 'tender-1',
              },
            },
          ],
        }),
      },
    };
    const service = createService(prisma, audit);

    const descriptor = await service.prepareDownload('file-1', internalUser);

    expect(descriptor.originalName).toBe('offer.pdf');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'BID_FILE_DOWNLOAD_INTERNAL',
        result: 'ALLOWED',
      }),
    );
  });
});
