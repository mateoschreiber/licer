import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../common/auth/authenticated-user.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RegisterSupplierDto } from './dto/register-supplier.dto';
import { SupplierActionDto } from './dto/supplier-action.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CreateSupplierDocumentDto } from './dto/create-supplier-document.dto';

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async register(dto: RegisterSupplierDto) {
    const providerRole = await this.prisma.role.findUnique({
      where: { name: 'PROVEEDOR' },
      select: { id: true },
    });
    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.create({
        data: {
          ruc: dto.ruc,
          legalName: dto.legalName,
          tradeName: dto.tradeName,
          contactName: dto.contactName ?? dto.legalRepresentative ?? dto.legalName,
          contactEmail: dto.contactEmail ?? dto.billingEmail,
          billingEmail: dto.billingEmail,
          billingAddress: dto.billingAddress,
          legalRepresentative: dto.legalRepresentative,
          relevantContacts: dto.relevantContacts,
          clientRelationshipDuration: dto.clientRelationshipDuration,
          phone: dto.phone,
          address: dto.address ?? dto.billingAddress,
          categories: dto.categories,
          status: 'PENDIENTE',
        },
      });

      await tx.user.create({
        data: {
          email: dto.contactEmail ?? dto.billingEmail,
          username: dto.username,
          name: dto.contactName ?? dto.legalRepresentative ?? dto.legalName,
          passwordHash,
          supplierId: supplier.id,
          roles: providerRole
            ? { create: [{ roleId: providerRole.id }] }
            : undefined,
        },
      });

      return supplier;
    });
  }

  findAll(query: PaginationDto) {
    const skip = (query.page - 1) * query.pageSize;
    return this.prisma.supplier.findMany({
      where: {
        deletedAt: null,
        ...(query.search
          ? {
              OR: [
                { ruc: { contains: query.search, mode: 'insensitive' } },
                { legalName: { contains: query.search, mode: 'insensitive' } },
                { tradeName: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        documents: {
          where: { deletedAt: null, voidedAt: null },
          include: { file: { select: { id: true, originalName: true, mime: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.pageSize,
    });
  }

  async findMine(user: AuthenticatedUser) {
    if (!user.supplierId) {
      throw new ForbiddenException('Supplier user required');
    }

    return this.findOne(user.supplierId);
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, deletedAt: null },
      include: {
        documents: {
          where: { deletedAt: null, voidedAt: null },
          include: { file: { select: { id: true, originalName: true, mime: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }
    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto, user: AuthenticatedUser) {
    if (!user.roles.includes('ADMIN')) {
      throw new ForbiddenException('Solo el administrador puede modificar proveedores');
    }
    const targetId = id;
    const existing = await this.prisma.supplier.findFirst({
      where: { id: targetId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Supplier not found');
    }

    const data = { ...dto };

    return this.prisma.supplier.update({
      where: { id: targetId },
      data,
    });
  }

  async addOwnDocument(dto: CreateSupplierDocumentDto, user: AuthenticatedUser) {
    if (!user.supplierId || !user.roles.includes('PROVEEDOR')) {
      throw new ForbiddenException('Supplier user required');
    }
    const [supplier, file] = await Promise.all([
      this.prisma.supplier.findFirst({ where: { id: user.supplierId, deletedAt: null } }),
      this.prisma.fileObject.findFirst({
        where: { id: dto.fileId, deletedAt: null, uploadedById: user.id },
      }),
    ]);
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }
    if (!file) {
      throw new NotFoundException('File not found');
    }

    const document = await this.prisma.supplierDocument.create({
      data: {
        supplierId: supplier.id,
        fileId: dto.fileId,
        type: dto.type,
        description: dto.description,
      },
      include: { file: { select: { id: true, originalName: true, mime: true } } },
    });
    await this.auditService.log({
      actorId: user.id,
      role: user.roles[0],
      action: 'SUPPLIER_DOCUMENT_CREATE_OWN',
      entity: 'SupplierDocument',
      entityId: document.id,
      result: 'ALLOWED',
      metadata: { supplierId: supplier.id, type: dto.type, fileId: dto.fileId },
    });
    return document;
  }

  async addDocument(
    supplierId: string,
    dto: CreateSupplierDocumentDto,
    user: AuthenticatedUser,
  ) {
    if (!user.roles.includes('ADMIN')) {
      throw new ForbiddenException('Solo el administrador puede agregar documentos');
    }
    const [supplier, file] = await Promise.all([
      this.prisma.supplier.findFirst({ where: { id: supplierId, deletedAt: null } }),
      this.prisma.fileObject.findFirst({ where: { id: dto.fileId, deletedAt: null } }),
    ]);
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }
    if (!file) {
      throw new NotFoundException('File not found');
    }

    const document = await this.prisma.supplierDocument.create({
      data: {
        supplierId,
        fileId: dto.fileId,
        type: dto.type,
        description: dto.description,
      },
      include: { file: { select: { id: true, originalName: true, mime: true } } },
    });
    await this.auditService.log({
      actorId: user.id,
      role: user.roles[0],
      action: 'SUPPLIER_DOCUMENT_CREATE',
      entity: 'SupplierDocument',
      entityId: document.id,
      result: 'ALLOWED',
      metadata: { supplierId, type: dto.type, fileId: dto.fileId },
    });
    return document;
  }

  async approve(id: string, dto: SupplierActionDto, user: AuthenticatedUser) {
    const supplier = await this.prisma.supplier.update({
      where: { id },
      data: { status: 'ACTIVO' },
    });

    await this.auditService.log({
      actorId: user.id,
      role: user.roles[0],
      action: 'SUPPLIER_APPROVE',
      entity: 'Supplier',
      entityId: id,
      result: 'ALLOWED',
      metadata: { reason: dto.reason },
    });

    return supplier;
  }

  async block(id: string, dto: SupplierActionDto, user: AuthenticatedUser) {
    const supplier = await this.prisma.supplier.update({
      where: { id },
      data: { status: 'BLOQUEADO' },
    });

    await this.auditService.log({
      actorId: user.id,
      role: user.roles[0],
      action: 'SUPPLIER_BLOCK',
      entity: 'Supplier',
      entityId: id,
      result: 'ALLOWED',
      metadata: { reason: dto.reason },
    });

    return supplier;
  }
}
