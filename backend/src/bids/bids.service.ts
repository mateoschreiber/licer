import {
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
import { ReplaceBidDto } from './dto/replace-bid.dto';

type BidWithTenderSupplier = Bid & {
  tender: Tender;
  supplier: Supplier;
};

@Injectable()
export class BidsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateBidDto, user: AuthenticatedUser) {
    const supplierId = this.requireSupplier(user);
    const [supplier, tender, lastBid] = await Promise.all([
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
    ]);

    this.assertSupplierCanBid(supplier);
    if (!tender) {
      throw new NotFoundException('Tender not found');
    }
    this.assertBidWindowOpen(tender);

    return this.prisma.bid.create({
      data: {
        tenderId: dto.tenderId,
        supplierId,
        userId: user.id,
        version: (lastBid?.version ?? 0) + 1,
        validityDays: dto.validityDays,
        paymentTerms: dto.paymentTerms,
        deliveryTerms: dto.deliveryTerms,
        totalAmount: this.sumTotal(dto),
        items: {
          create: dto.items.map((item) => ({
            tenderItemId: item.tenderItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            tax: item.tax,
            total: item.total,
            brandModel: item.brandModel,
            notes: item.notes,
          })),
        },
        documents: {
          create:
            dto.documents?.map((document) => ({
              fileId: document.fileId,
              type: document.type,
            })) ?? [],
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
      include: supplierView
        ? this.bidIncludeForSupplier()
        : this.bidIncludeForInternal(),
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.pageSize,
    });
  }

  async findOne(
    id: string,
    user: AuthenticatedUser,
    ip?: string,
  ) {
    const bid = await this.prisma.bid.findFirst({
      where: { id, deletedAt: null },
      include: user.roles.includes(ROLES.PROVEEDOR)
        ? this.bidIncludeForSupplier()
        : this.bidIncludeForInternal(),
    });

    if (!bid) {
      throw new NotFoundException('Bid not found');
    }

    if (user.roles.includes(ROLES.PROVEEDOR)) {
      if (bid.supplierId !== user.supplierId) {
        await this.auditDeniedBidAccess(id, user, ip);
        throw new ForbiddenException('Supplier cannot access another supplier bid');
      }
      return bid;
    }

    if (!user.permissions.includes('bids:read:internal')) {
      await this.auditDeniedBidAccess(id, user, ip);
      throw new ForbiddenException('Internal permission required');
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
      throw new NotFoundException('Bid not found');
    }
    this.assertOwnBid(bid, supplierId);
    this.assertSupplierCanBid(bid.supplier);
    this.assertBidWindowOpen(bid.tender);
    if (bid.status !== 'BORRADOR') {
      throw new ForbiddenException('Only draft bids can be submitted');
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

  async replace(id: string, dto: ReplaceBidDto, user: AuthenticatedUser) {
    const supplierId = this.requireSupplier(user);
    const oldBid = await this.prisma.bid.findFirst({
      where: { id, deletedAt: null },
      include: { tender: true, supplier: true },
    });

    if (!oldBid) {
      throw new NotFoundException('Bid not found');
    }
    this.assertOwnBid(oldBid, supplierId);
    this.assertSupplierCanBid(oldBid.supplier);
    this.assertBidWindowOpen(oldBid.tender);
    if (!oldBid.tender.allowBidReplacement) {
      throw new ForbiddenException('Bid replacement is not allowed');
    }
    if (oldBid.status !== 'ENVIADA') {
      throw new ForbiddenException('Only submitted bids can be replaced');
    }

    return this.prisma.$transaction(async (tx) => {
      const replacement = await tx.bid.create({
        data: {
          tenderId: oldBid.tenderId,
          supplierId,
          userId: user.id,
          version: oldBid.version + 1,
          status: 'ENVIADA',
          submittedAt: new Date(),
          receiptCode: this.receiptCode(id),
          validityDays: dto.validityDays,
          paymentTerms: dto.paymentTerms,
          deliveryTerms: dto.deliveryTerms,
          totalAmount: this.sumTotal(dto),
          items: {
            create: dto.items.map((item) => ({
              tenderItemId: item.tenderItemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              tax: item.tax,
              total: item.total,
              brandModel: item.brandModel,
              notes: item.notes,
            })),
          },
          documents: {
            create:
              dto.documents?.map((document) => ({
                fileId: document.fileId,
                type: document.type,
              })) ?? [],
          },
        },
      });

      await tx.bid.update({
        where: { id },
        data: {
          status: 'REEMPLAZADA',
          replacedById: replacement.id,
        },
      });

      return tx.bid.findUniqueOrThrow({
        where: { id: replacement.id },
        include: this.bidIncludeForSupplier(),
      });
    });
  }

  private requireSupplier(user: AuthenticatedUser) {
    if (!user.supplierId) {
      throw new ForbiddenException('Supplier user required');
    }
    return user.supplierId;
  }

  private assertOwnBid(bid: Bid, supplierId: string) {
    if (bid.supplierId !== supplierId) {
      throw new ForbiddenException('Supplier cannot access another supplier bid');
    }
  }

  private assertSupplierCanBid(supplier: Supplier | null) {
    if (!supplier || supplier.status !== 'ACTIVO') {
      throw new ForbiddenException('Supplier must be ACTIVO to bid');
    }
  }

  private assertBidWindowOpen(tender: Pick<Tender, 'bidDeadline'>) {
    if (tender.bidDeadline.getTime() <= Date.now()) {
      throw new ForbiddenException('Bid deadline is closed');
    }
  }

  private sumTotal(dto: CreateBidDto) {
    return dto.items.reduce((sum, item) => sum + Number(item.total), 0);
  }

  private receiptCode(id: string) {
    return `REC-${Date.now()}-${id.slice(0, 8)}`;
  }

  private async auditDeniedBidAccess(
    bidId: string,
    user: AuthenticatedUser,
    ip?: string,
  ) {
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
