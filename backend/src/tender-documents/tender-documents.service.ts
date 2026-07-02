import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../common/auth/authenticated-user.interface';
import { ROLES } from '../common/constants/roles';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenderDocumentDto } from './dto/create-tender-document.dto';
import { VoidTenderDocumentDto } from './dto/void-tender-document.dto';

@Injectable()
export class TenderDocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTenderDocumentDto, user: AuthenticatedUser) {
    const lastVersion = await this.prisma.tenderDocument.findFirst({
      where: { tenderId: dto.tenderId, type: dto.type },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    return this.prisma.tenderDocument.create({
      data: {
        tenderId: dto.tenderId,
        type: dto.type,
        title: dto.title,
        fileId: dto.fileId,
        version: (lastVersion?.version ?? 0) + 1,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : new Date(),
        createdById: user.id,
      },
      select: this.safeSelect(),
    });
  }

  findAll(user: AuthenticatedUser, tenderId?: string) {
    const supplierView = user.roles.includes(ROLES.PROVEEDOR);
    const where: Prisma.TenderDocumentWhereInput = {
      voidedAt: null,
      tenderId,
      ...(supplierView
        ? {
            publishedAt: { not: null },
            tender: {
              status: { in: ['PUBLICADA', 'CONSULTAS_CERRADAS', 'RECEPCION'] },
              deletedAt: null,
            },
          }
        : {}),
    };

    return this.prisma.tenderDocument.findMany({
      where,
      select: this.safeSelect(),
      orderBy: [{ tenderId: 'asc' }, { version: 'asc' }],
    });
  }

  async void(id: string, dto: VoidTenderDocumentDto) {
    const existing = await this.prisma.tenderDocument.findFirst({
      where: { id, voidedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Tender document not found');
    }

    return this.prisma.tenderDocument.update({
      where: { id },
      data: {
        voidedAt: new Date(),
        voidReason: dto.reason,
      },
      select: this.safeSelect(),
    });
  }

  private safeSelect() {
    return {
      id: true,
      tenderId: true,
      type: true,
      version: true,
      title: true,
      fileId: true,
      publishedAt: true,
      voidedAt: true,
      voidReason: true,
      createdAt: true,
      updatedAt: true,
    } as const;
  }
}
