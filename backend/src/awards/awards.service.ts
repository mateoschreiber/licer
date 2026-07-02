import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedUser } from '../common/auth/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAwardDto } from './dto/create-award.dto';
import { DecisionDto } from './dto/decision.dto';

@Injectable()
export class AwardsService {
  constructor(private readonly prisma: PrismaService) {}

  async award(dto: CreateAwardDto, user: AuthenticatedUser) {
    const data = await this.validateAwardData(dto);
    return this.prisma.$transaction(async (tx) => {
      const award = await tx.award.create({
        data: {
          tenderId: data.tenderId,
          supplierId: data.supplierId,
          bidId: data.bidId,
          amount: data.amount,
          status: 'ADJUDICADA',
          reason: dto.reason,
          approvedById: user.id,
        },
      });
      await tx.tender.update({
        where: { id: dto.tenderId },
        data: { status: 'ADJUDICADA' },
      });
      return award;
    });
  }

  cancel(dto: DecisionDto, user: AuthenticatedUser) {
    return this.decision(dto, user, 'CANCELADA');
  }

  desert(dto: DecisionDto, user: AuthenticatedUser) {
    return this.decision(dto, user, 'DESIERTA');
  }

  async resolve(identifier: string) {
    if (!identifier || identifier.trim().length === 0) {
      return { mode: 'none' as const, matchedBy: null };
    }

    const id = identifier.trim();

    const bid = await this.prisma.bid.findFirst({
      where: {
        id: id,
        deletedAt: null,
        status: { notIn: ['BORRADOR', 'ANULADA'] },
      },
      include: {
        tender: { select: { id: true, code: true, title: true, status: true, currency: true } },
        supplier: { select: { id: true, ruc: true, legalName: true, tradeName: true, status: true } },
      },
    });

    if (bid) {
      return this.buildSingleResponse('bidId', bid.tender, bid.supplier, bid);
    }

    const tenderByCode = await this.prisma.tender.findFirst({
      where: {
        code: { equals: id, mode: 'insensitive' },
        deletedAt: null,
      },
      select: { id: true, code: true, title: true, status: true, currency: true },
    });

    if (tenderByCode) {
      return this.buildTenderResponse('tenderCode', tenderByCode);
    }

    const tender = await this.prisma.tender.findFirst({
      where: { id: id, deletedAt: null },
      select: { id: true, code: true, title: true, status: true, currency: true },
    });

    if (tender) {
      return this.buildTenderResponse('tenderId', tender);
    }

    const supplierExact = await this.prisma.supplier.findFirst({
      where: {
        OR: [
          { id: id, deletedAt: null },
          { ruc: { equals: id, mode: 'insensitive' }, deletedAt: null },
        ],
      },
      select: { id: true, ruc: true, legalName: true, tradeName: true, status: true },
    });

    if (supplierExact) {
      return this.buildSupplierResponse(
        supplierExact.id === id ? 'supplierId' : 'supplierRuc',
        supplierExact,
      );
    }

    const supplierMatches = await this.prisma.supplier.findMany({
      where: {
        deletedAt: null,
        OR: [
          { legalName: { contains: id, mode: 'insensitive' } },
          { tradeName: { contains: id, mode: 'insensitive' } },
        ],
      },
      select: { id: true, ruc: true, legalName: true, tradeName: true, status: true },
      orderBy: { legalName: 'asc' },
      take: 6,
    });

    if (supplierMatches.length > 1) {
      return {
        mode: 'multiple' as const,
        matchedBy: 'supplierName' as const,
        options: supplierMatches,
        warnings: ['El identificador coincide con varios proveedores. Seleccione una opcion.'],
      };
    }

    if (supplierMatches.length === 1) {
      return this.buildSupplierResponse('supplierName', supplierMatches[0]);
    }

    return { mode: 'none' as const, matchedBy: null, message: 'No se encontro ningun resultado para el identificador ingresado' };
  }

  private async buildSupplierResponse(
    matchedBy: 'supplierId' | 'supplierRuc' | 'supplierName',
    supplier: { id: string; ruc: string; legalName: string; tradeName: string | null; status: string },
  ) {
    const eligibleBids = await this.prisma.bid.findMany({
      where: {
        supplierId: supplier.id,
        deletedAt: null,
        status: { notIn: ['BORRADOR', 'ANULADA'] },
      },
      include: {
        tender: { select: { id: true, code: true, title: true, status: true, currency: true } },
      },
      orderBy: { submittedAt: 'desc' },
      take: 20,
    });

    return {
      mode: 'single' as const,
      matchedBy,
      supplier,
      eligibleBids: eligibleBids.map((b) => ({
        id: b.id,
        version: b.version,
        status: b.status,
        submittedAt: b.submittedAt,
        totalAmount: b.totalAmount,
        currency: b.currency,
        tender: b.tender,
      })),
      warnings: eligibleBids.length === 0 ? ['No se encontraron ofertas elegibles para este proveedor'] : [],
    };
  }

  private async buildTenderResponse(
    matchedBy: 'tenderId' | 'tenderCode',
    tender: { id: string; code: string; title: string; status: string; currency: string },
  ) {
    const eligibleBids = await this.prisma.bid.findMany({
      where: {
        tenderId: tender.id,
        deletedAt: null,
        status: { notIn: ['BORRADOR', 'ANULADA'] },
      },
      include: {
        supplier: { select: { id: true, ruc: true, legalName: true, tradeName: true, status: true } },
      },
      orderBy: { submittedAt: 'desc' },
      take: 20,
    });

    return {
      mode: 'single' as const,
      matchedBy,
      tender,
      eligibleBids: eligibleBids.map((b) => ({
        id: b.id,
        version: b.version,
        status: b.status,
        submittedAt: b.submittedAt,
        totalAmount: b.totalAmount,
        currency: b.currency,
        supplier: b.supplier,
      })),
      warnings: eligibleBids.length === 0 ? ['No se encontraron ofertas elegibles para esta licitacion'] : [],
    };
  }

  private buildSingleResponse(
    matchedBy: 'bidId',
    tender: { id: string; code: string; title: string; status: string; currency: string },
    supplier: { id: string; ruc: string; legalName: string; tradeName: string | null; status: string },
    bid: { id: string; version: number; status: string; submittedAt: Date | null; totalAmount: unknown; currency: string },
  ) {
    return {
      mode: 'single' as const,
      matchedBy,
      tender,
      supplier,
      bid: {
        id: bid.id,
        version: bid.version,
        status: bid.status,
        submittedAt: bid.submittedAt,
        totalAmount: bid.totalAmount,
        currency: bid.currency,
      },
    };
  }

  private async validateAwardData(dto: CreateAwardDto) {
    const tender = await this.prisma.tender.findFirst({
      where: { id: dto.tenderId, deletedAt: null },
      select: { id: true },
    });
    if (!tender) {
      throw new NotFoundException('Tender not found');
    }

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, deletedAt: null },
      select: { id: true },
    });
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    if (!dto.bidId) {
      return {
        tenderId: dto.tenderId,
        supplierId: dto.supplierId,
        bidId: undefined,
        amount: dto.amount,
      };
    }

    const bid = await this.prisma.bid.findFirst({
      where: {
        id: dto.bidId,
        deletedAt: null,
        status: { notIn: ['BORRADOR', 'ANULADA'] },
      },
      select: {
        id: true,
        tenderId: true,
        supplierId: true,
        totalAmount: true,
      },
    });
    if (!bid) {
      throw new NotFoundException('Bid not found');
    }
    if (bid.tenderId !== dto.tenderId || bid.supplierId !== dto.supplierId) {
      throw new BadRequestException('La oferta no pertenece a la licitacion y proveedor indicados');
    }

    return {
      tenderId: dto.tenderId,
      supplierId: dto.supplierId,
      bidId: bid.id,
      amount: dto.amount ?? bid.totalAmount,
    };
  }

  private async decision(
    dto: DecisionDto,
    user: AuthenticatedUser,
    status: 'CANCELADA' | 'DESIERTA',
  ) {
    return this.prisma.$transaction(async (tx) => {
      const award = await tx.award.create({
        data: {
          tenderId: dto.tenderId,
          status,
          reason: dto.reason,
          approvedById: user.id,
        },
      });
      await tx.tender.update({
        where: { id: dto.tenderId },
        data: { status },
      });
      return award;
    });
  }
}
