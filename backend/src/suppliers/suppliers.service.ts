import {
  BadRequestException,
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
import { CreateSupplierStaffDto } from './dto/create-supplier-staff.dto';
import { UpdateSupplierStaffDto } from './dto/update-supplier-staff.dto';

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
          legalRepresentative:
            dto.legalRepresentative ??
            ([dto.legalRepresentativeFirstName, dto.legalRepresentativeLastName]
              .filter(Boolean)
              .join(' ') ||
              undefined),
          legalRepresentativeFirstName: dto.legalRepresentativeFirstName,
          legalRepresentativeLastName: dto.legalRepresentativeLastName,
          legalRepresentativeDocumentId: dto.legalRepresentativeDocumentId,
          relevantContacts: dto.relevantContacts,
          clientRelationshipDuration: dto.clientRelationshipDuration,
          phone: dto.phone,
          phoneCountry: dto.phoneCountry,
          address: dto.address ?? dto.billingAddress,
          categories: dto.categories,
          status: 'PENDIENTE',
        },
      });

      await tx.user.create({
        data: {
          email: dto.contactEmail ?? dto.billingEmail,
          username: dto.username,
          name:
            dto.contactName ??
            dto.legalRepresentative ??
            ([dto.legalRepresentativeFirstName, dto.legalRepresentativeLastName]
              .filter(Boolean)
              .join(' ') ||
              dto.legalName),
          passwordHash,
          supplierId: supplier.id,
          roles: providerRole ? { create: [{ roleId: providerRole.id }] } : undefined,
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
      throw new ForbiddenException('Se requiere un usuario proveedor');
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
      throw new NotFoundException('Proveedor no encontrado');
    }
    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto, user: AuthenticatedUser) {
    const own = user.roles.includes('PROVEEDOR');
    const targetId = own ? user.supplierId : id;
    if (!targetId || (own && targetId !== id))
      throw new ForbiddenException('El recurso no pertenece al proveedor');
    const existing = await this.prisma.supplier.findFirst({
      where: { id: targetId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Proveedor no encontrado');
    const data = { ...dto };
    if ('legalRepresentativeFirstName' in dto || 'legalRepresentativeLastName' in dto) {
      data.legalRepresentative =
        [
          dto.legalRepresentativeFirstName ?? existing.legalRepresentativeFirstName,
          dto.legalRepresentativeLastName ?? existing.legalRepresentativeLastName,
        ]
          .filter(Boolean)
          .join(' ') || undefined;
    }
    if (own) delete data.status;
    return this.prisma.supplier.update({ where: { id: targetId }, data });
  }

  async findMyUsers(user: AuthenticatedUser) {
    return this.prisma.supplierStaff.findMany({
      where: { supplierId: this.requireSupplierId(user), deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createMyUser(dto: CreateSupplierStaffDto, user: AuthenticatedUser) {
    return this.prisma.supplierStaff.create({
      data: {
        supplierId: this.requireSupplierId(user),
        firstName: dto.firstName,
        lastName: dto.lastName,
        documentId: dto.documentId,
        phone: dto.phone,
        phoneCountry: dto.phoneCountry,
        title: dto.title,
      },
    });
  }

  async updateMyUser(id: string, dto: UpdateSupplierStaffDto, user: AuthenticatedUser) {
    const staff = await this.findOwnedStaff(id, user);
    return this.prisma.supplierStaff.update({ where: { id: staff.id }, data: dto });
  }

  async deleteMyUser(id: string, user: AuthenticatedUser) {
    const staff = await this.findOwnedStaff(id, user);
    return this.prisma.supplierStaff.update({
      where: { id: staff.id },
      data: { deletedAt: new Date() },
    });
  }

  async updateDocument(id: string, supplierId: string, status: string, user: AuthenticatedUser) {
    await this.findDocument(id, supplierId);
    const document = await this.prisma.supplierDocument.update({
      where: { id },
      data: { status: status as never },
      include: { file: { select: { id: true, originalName: true, mime: true } } },
    });
    await this.auditService.log({
      actorId: user.id,
      role: user.roles[0],
      action: 'SUPPLIER_DOCUMENT_UPDATE',
      entity: 'SupplierDocument',
      entityId: id,
      result: 'ALLOWED',
      metadata: { supplierId, status },
    });
    return document;
  }

  async deleteDocument(id: string, supplierId: string, user: AuthenticatedUser) {
    const document = await this.findDocument(id, supplierId);
    await this.prisma.$transaction(async (tx) => {
      await tx.supplierDocument.update({
        where: { id },
        data: { deletedAt: new Date(), voidedAt: new Date() },
      });
      await tx.fileObject.update({
        where: { id: document.fileId },
        data: { deletedAt: new Date() },
      });
    });
    await this.auditService.log({
      actorId: user.id,
      role: user.roles[0],
      action: 'SUPPLIER_DOCUMENT_DELETE',
      entity: 'SupplierDocument',
      entityId: id,
      result: 'ALLOWED',
      metadata: { supplierId },
    });
  }

  async delete(id: string, user: AuthenticatedUser) {
    await this.findOne(id);
    const deletedAt = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.supplier.update({ where: { id }, data: { deletedAt } });
      await tx.user.updateMany({
        where: { supplierId: id, deletedAt: null },
        data: { status: 'BLOCKED', deletedAt },
      });
    });
    await this.auditService.log({
      actorId: user.id,
      role: user.roles[0],
      action: 'SUPPLIER_DELETE',
      entity: 'Supplier',
      entityId: id,
      result: 'ALLOWED',
    });
  }

  async addOwnDocument(dto: CreateSupplierDocumentDto, user: AuthenticatedUser) {
    if (!user.supplierId || !user.roles.includes('PROVEEDOR')) {
      throw new ForbiddenException('Se requiere un usuario proveedor');
    }
    const [supplier, file] = await Promise.all([
      this.prisma.supplier.findFirst({ where: { id: user.supplierId, deletedAt: null } }),
      this.prisma.fileObject.findFirst({
        where: { id: dto.fileId, deletedAt: null, uploadedById: user.id },
      }),
    ]);
    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }
    if (!file) {
      throw new NotFoundException('Archivo no encontrado');
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

  async addDocument(supplierId: string, dto: CreateSupplierDocumentDto, user: AuthenticatedUser) {
    if (!user.roles.includes('ADMIN')) {
      throw new ForbiddenException('Solo el administrador puede agregar documentos');
    }
    const [supplier, file] = await Promise.all([
      this.prisma.supplier.findFirst({ where: { id: supplierId, deletedAt: null } }),
      this.prisma.fileObject.findFirst({ where: { id: dto.fileId, deletedAt: null } }),
    ]);
    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }
    if (!file) {
      throw new NotFoundException('Archivo no encontrado');
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

  private requireSupplierId(user: AuthenticatedUser) {
    if (!user.supplierId || !user.roles.includes('PROVEEDOR'))
      throw new ForbiddenException('Se requiere un usuario proveedor');
    return user.supplierId;
  }

  private async findOwnedStaff(id: string, user: AuthenticatedUser) {
    const staff = await this.prisma.supplierStaff.findFirst({
      where: { id, supplierId: this.requireSupplierId(user), deletedAt: null },
    });
    if (!staff) throw new NotFoundException('Funcionario del proveedor no encontrado');
    return staff;
  }

  private async findDocument(id: string, supplierId: string) {
    const document = await this.prisma.supplierDocument.findFirst({
      where: { id, supplierId, deletedAt: null, voidedAt: null },
      include: { file: true },
    });
    if (!document) throw new NotFoundException('Documento del proveedor no encontrado');
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
