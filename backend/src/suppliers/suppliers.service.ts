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
          contactName: dto.contactName,
          contactEmail: dto.contactEmail,
          phone: dto.phone,
          address: dto.address,
          categories: dto.categories,
          status: 'PENDIENTE',
        },
      });

      await tx.user.create({
        data: {
          email: dto.contactEmail,
          name: dto.contactName,
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
      include: { documents: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.pageSize,
    });
  }

  async findMine(user: AuthenticatedUser) {
    if (!user.supplierId) {
      throw new ForbiddenException('Supplier user required');
    }

    return this.prisma.supplier.findFirstOrThrow({
      where: { id: user.supplierId, deletedAt: null },
      include: { documents: true },
    });
  }

  async update(id: string, dto: UpdateSupplierDto, user: AuthenticatedUser) {
    const targetId = user.roles.includes('PROVEEDOR') ? user.supplierId : id;
    if (!targetId || (user.roles.includes('PROVEEDOR') && targetId !== id)) {
      throw new ForbiddenException('Supplier ownership mismatch');
    }

    const existing = await this.prisma.supplier.findFirst({
      where: { id: targetId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Supplier not found');
    }

    const data = { ...dto };
    if (user.roles.includes('PROVEEDOR')) {
      delete data.status;
    }

    return this.prisma.supplier.update({
      where: { id: targetId },
      data,
    });
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
