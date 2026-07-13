import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { resolve, join } from 'path';
import { createHash, randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../common/auth/authenticated-user.interface';
import { ROLES } from '../common/constants/roles';
import { PrismaService } from '../prisma/prisma.service';

type FileWithRelations = Prisma.FileObjectGetPayload<{
  include: {
    supplierDocuments: true;
    tenderDocuments: { include: { tender: true } };
    bidDocuments: { include: { bid: true } };
  };
}>;

export interface FileDownloadDescriptor {
  storagePath: string;
  originalName: string;
  mime: string;
  size: number;
}

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async storeUpload(file: { originalname: string; mimetype: string; buffer: Buffer; size: number }, uploadedById: string) {
    const storageRoot = process.env.STORAGE_PRIVATE_PATH ?? '/app/storage/private';
    await mkdir(storageRoot, { recursive: true });
    const id = randomUUID();
    const storagePath = join(storageRoot, id);
    await writeFile(storagePath, file.buffer);
    const stored = await this.prisma.fileObject.create({
      data: {
        storagePath,
        originalName: file.originalname,
        mime: file.mimetype || 'application/octet-stream',
        size: BigInt(file.size),
        sha256: createHash('sha256').update(file.buffer).digest('hex'),
        uploadedById,
      },
      select: { id: true, originalName: true, mime: true, size: true },
    });
    return { ...stored, size: Number(stored.size) };
  }

  async prepareDownload(
    id: string,
    user: AuthenticatedUser,
    ip?: string,
  ): Promise<FileDownloadDescriptor> {
    const file = await this.prisma.fileObject.findFirst({
      where: { id, deletedAt: null },
      include: {
        supplierDocuments: true,
        tenderDocuments: { include: { tender: true } },
        bidDocuments: { include: { bid: true } },
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const internal = user.permissions.includes('files:download:internal');
    const supplier = user.roles.includes(ROLES.PROVEEDOR);
    const own = supplier ? this.isSupplierAllowed(file, user) : false;

    if (!internal && !own) {
      await this.auditService.log({
        actorId: user.id,
        role: user.roles[0],
        ip,
        action: 'FILE_DOWNLOAD_DENIED',
        entity: 'FileObject',
        entityId: id,
        result: 'DENIED',
      });
      throw new ForbiddenException('File download denied');
    }

    const bidDocument = file.bidDocuments[0];
    if (internal && bidDocument) {
      await this.auditService.log({
        actorId: user.id,
        role: user.roles[0],
        ip,
        action: 'BID_FILE_DOWNLOAD_INTERNAL',
        entity: 'BidDocument',
        entityId: bidDocument.id,
        result: 'ALLOWED',
        metadata: {
          fileId: file.id,
          bidId: bidDocument.bidId,
          supplierId: bidDocument.bid.supplierId,
          tenderId: bidDocument.bid.tenderId,
        },
      });
    }

    return {
      storagePath: resolve(file.storagePath),
      originalName: file.originalName,
      mime: file.mime,
      size: Number(file.size),
    };
  }

  private isSupplierAllowed(file: FileWithRelations, user: AuthenticatedUser) {
    if (file.uploadedById === user.id) {
      return true;
    }

    return (
      file.supplierDocuments.some(
        (document) => document.supplierId === user.supplierId && !document.voidedAt,
      ) ||
      file.bidDocuments.some(
        (document) =>
          document.bid.supplierId === user.supplierId && !document.voidedAt,
      ) ||
      file.tenderDocuments.some(
        (document) =>
          !document.voidedAt &&
          Boolean(document.publishedAt) &&
          ['PUBLICADA', 'CONSULTAS_CERRADAS', 'RECEPCION'].includes(
            document.tender.status,
          ),
      )
    );
  }
}
