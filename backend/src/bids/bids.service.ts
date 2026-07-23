import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Bid, Prisma, Supplier, Tender } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../common/auth/authenticated-user.interface';
import { ROLES } from '../common/constants/roles';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBidDto } from './dto/create-bid.dto';

@Injectable()
export class BidsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateBidDto, user: AuthenticatedUser) {
    const supplierId = this.requireSupplier(user);
    const [supplier, tender, lastBid, existingBid] = await Promise.all([
      this.prisma.supplier.findUnique({ where: { id: supplierId } }),
      this.prisma.tender.findFirst({
        where: {
          id: dto.tenderId,
          deletedAt: null,
          status: { in: ['PUBLICADA', 'CONSULTAS_CERRADAS', 'RECEPCION'] },
        },
      }),
      this.prisma.bid.findFirst({
        where: { tenderId: dto.tenderId, supplierId },
        orderBy: { version: 'desc' },
        select: { version: true },
      }),
      this.prisma.bid.findFirst({
        where: {
          tenderId: dto.tenderId,
          supplierId,
          deletedAt: null,
          status: { in: ['ENVIADA', 'EVALUADA', 'REEMPLAZADA'] },
        },
        select: { id: true },
      }),
    ]);

    this.assertSupplierCanBid(supplier);
    if (!tender) {
      throw new NotFoundException('Licitación no encontrada');
    }
    this.assertBidWindowOpen(tender);
    if (existingBid) {
      throw new BadRequestException('Ya presentó una oferta para esta licitación');
    }
    await this.validateBidItems(dto, tender.id);

    return this.prisma.bid.create({
      data: {
        tenderId: dto.tenderId,
        supplierId,
        userId: user.id,
        version: (lastBid?.version ?? 0) + 1,
        validityDays: dto.validityDays,
        paymentTerms: tender.paymentMethod === 'CREDITO' ? tender.paymentTerms : 'CONTADO',
        deliveryTerms: dto.deliveryTerms,
        vatIncludedAccepted: dto.vatIncludedAccepted,
        totalAmount: this.sumTotal(dto),
        items: {
          create: dto.items.map((item) => ({
            tenderItemId: item.tenderItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            tax: 0,
            total: item.total,
            description: item.description,
            brand: item.brand,
            model: item.model,
            brandModel: item.brandModel,
            pendingApproval: item.pendingApproval,
            notes: item.notes,
          })),
        },
      },
      include: this.bidIncludeForSupplier(),
    });
  }

  findAll(query: PaginationDto, user: AuthenticatedUser) {
    const skip = (query.page - 1) * query.pageSize;
    const supplierView = user.roles.includes(ROLES.PROVEEDOR);
    const where: Prisma.BidWhereInput = {
      deletedAt: null,
      ...(supplierView ? { supplierId: user.supplierId ?? 'none' } : {}),
      ...(query.search
        ? {
            tender: {
              OR: [
                { code: { contains: query.search, mode: 'insensitive' } },
                { title: { contains: query.search, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    };

    return this.prisma.bid.findMany({
      where,
      include: supplierView ? this.bidIncludeForSupplier() : this.bidIncludeForInternal(),
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.pageSize,
    });
  }

  async findOne(id: string, user: AuthenticatedUser, ip?: string) {
    const bid = await this.prisma.bid.findFirst({
      where: { id, deletedAt: null },
      include: user.roles.includes(ROLES.PROVEEDOR)
        ? this.bidIncludeForSupplier()
        : this.bidIncludeForInternal(),
    });

    if (!bid) {
      throw new NotFoundException('Oferta no encontrada');
    }

    if (user.roles.includes(ROLES.PROVEEDOR)) {
      if (bid.supplierId !== user.supplierId) {
        await this.auditDeniedBidAccess(id, user, ip);
        throw new ForbiddenException('No puede acceder a la oferta de otro proveedor');
      }
      return bid;
    }

    if (!user.permissions.includes('bids:read:internal')) {
      await this.auditDeniedBidAccess(id, user, ip);
      throw new ForbiddenException('Se requiere permiso interno');
    }

    await this.auditService.log({
      actorId: user.id,
      role: user.roles[0],
      ip,
      action: 'BID_VIEW_INTERNAL',
      entity: 'Bid',
      entityId: id,
      result: 'ALLOWED',
      metadata: { tenderId: bid.tenderId, supplierId: bid.supplierId },
    });

    return bid;
  }

  async submit(id: string, user: AuthenticatedUser) {
    const supplierId = this.requireSupplier(user);
    const bid = await this.prisma.bid.findFirst({
      where: { id, deletedAt: null },
      include: { tender: true, supplier: true },
    });

    if (!bid) {
      throw new NotFoundException('Oferta no encontrada');
    }
    this.assertOwnBid(bid, supplierId);
    this.assertSupplierCanBid(bid.supplier);
    this.assertBidWindowOpen(bid.tender);
    if (bid.status !== 'BORRADOR') {
      throw new ForbiddenException('Solo se pueden enviar ofertas en borrador');
    }
    const existingBid = await this.prisma.bid.findFirst({
      where: {
        tenderId: bid.tenderId,
        supplierId,
        deletedAt: null,
        status: { in: ['ENVIADA', 'EVALUADA'] },
        id: { not: bid.id },
      },
      select: { id: true },
    });
    if (existingBid) {
      throw new BadRequestException('Ya presentó una oferta para esta licitación');
    }

    return this.prisma.bid.update({
      where: { id },
      data: {
        status: 'ENVIADA',
        submittedAt: new Date(),
        receiptCode: this.receiptCode(id),
      },
      include: this.bidIncludeForSupplier(),
    });
  }

  async remove(id: string) {
    const bid = await this.prisma.bid.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!bid) {
      throw new NotFoundException('Oferta no encontrada');
    }

    const now = new Date();
    return this.prisma.bid.update({
      where: { id },
      data: {
        status: 'ANULADA',
        voidedAt: now,
        voidReason: 'Oferta eliminada por administrador',
        deletedAt: now,
      },
      select: { id: true, tenderId: true, supplierId: true, deletedAt: true },
    });
  }

  private async validateBidItems(dto: CreateBidDto, tenderId: string) {
    if (dto.items.length === 0) {
      throw new BadRequestException('La oferta debe incluir al menos un ítem');
    }
    const linkedIds = [
      ...new Set(dto.items.flatMap((item) => (item.tenderItemId ? [item.tenderItemId] : []))),
    ];
    if (linkedIds.length) {
      const validCount = await this.prisma.tenderItem.count({
        where: { id: { in: linkedIds }, tenderId, deletedAt: null },
      });
      if (validCount !== linkedIds.length) {
        throw new BadRequestException('Uno o más ítems no pertenecen a la licitación seleccionada');
      }
    }
    const invalidAdditional = dto.items.some(
      (item) => !item.tenderItemId && (!item.pendingApproval || !item.description?.trim()),
    );
    if (invalidAdditional) {
      throw new BadRequestException(
        'Los ítems adicionales requieren descripción y aceptación de aprobación pendiente',
      );
    }
  }

  private requireSupplier(user: AuthenticatedUser) {
    if (!user.supplierId) {
      throw new ForbiddenException('Se requiere un usuario proveedor');
    }
    return user.supplierId;
  }

  private assertOwnBid(bid: Bid, supplierId: string) {
    if (bid.supplierId !== supplierId) {
      throw new ForbiddenException('No puede acceder a la oferta de otro proveedor');
    }
  }

  private assertSupplierCanBid(supplier: Supplier | null) {
    if (!supplier || supplier.status !== 'ACTIVO') {
      throw new ForbiddenException('El proveedor debe estar ACTIVO para ofertar');
    }
  }

  private assertBidWindowOpen(tender: Pick<Tender, 'bidDeadline'>) {
    if (tender.bidDeadline.getTime() <= Date.now()) {
      throw new ForbiddenException('El plazo de ofertas está cerrado');
    }
  }

  private sumTotal(dto: CreateBidDto) {
    return dto.items.reduce((sum, item) => sum + Number(item.total), 0);
  }

  private receiptCode(id: string) {
    return `REC-${Date.now()}-${id.slice(0, 8)}`;
  }

  private async auditDeniedBidAccess(bidId: string, user: AuthenticatedUser, ip?: string) {
    await this.auditService.log({
      actorId: user.id,
      role: user.roles[0],
      ip,
      action: 'BID_ACCESS_DENIED',
      entity: 'Bid',
      entityId: bidId,
      result: 'DENIED',
    });
  }

  private bidIncludeForSupplier() {
    return {
      tender: {
        select: {
          id: true,
          code: true,
          title: true,
          status: true,
          bidDeadline: true,
        },
      },
      items: true,
      documents: {
        select: {
          id: true,
          fileId: true,
          type: true,
          uploadedAt: true,
          voidedAt: true,
        },
      },
    } as const;
  }

  private bidIncludeForInternal() {
    return {
      tender: true,
      supplier: true,
      items: true,
      documents: {
        include: {
          file: {
            select: {
              id: true,
              originalName: true,
              mime: true,
              size: true,
              sha256: true,
            },
          },
        },
      },
      scores: true,
    } as const;
  }
}
