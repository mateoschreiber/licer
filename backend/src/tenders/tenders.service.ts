import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Tender } from '@prisma/client';
import { AuthenticatedUser } from '../common/auth/authenticated-user.interface';
import { ROLES } from '../common/constants/roles';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenderDto } from './dto/create-tender.dto';
import { CreateTenderItemDto } from './dto/create-tender-item.dto';
import { UpdateTenderDto } from './dto/update-tender.dto';

const supplierVisibleStatuses = [
  'PUBLICADA',
  'CONSULTAS_CERRADAS',
  'RECEPCION',
] as const;

@Injectable()
export class TendersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: PaginationDto, user: AuthenticatedUser) {
    const skip = (query.page - 1) * query.pageSize;
    const supplierView = user.roles.includes(ROLES.PROVEEDOR);
    const where: Prisma.TenderWhereInput = {
      deletedAt: null,
      ...(supplierView
        ? { status: { in: [...supplierVisibleStatuses] } }
        : {}),
      ...(query.search
        ? {
            OR: [
              { code: { contains: query.search, mode: 'insensitive' } },
              { title: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return this.prisma.tender.findMany({
      where,
      select: supplierView ? this.supplierTenderSelect() : this.internalTenderSelect(),
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.pageSize,
    });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const supplierView = user.roles.includes(ROLES.PROVEEDOR);
    const tender = await this.prisma.tender.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(supplierView
          ? { status: { in: [...supplierVisibleStatuses] } }
          : {}),
      },
      select: supplierView ? this.supplierTenderSelect() : this.internalTenderSelect(),
    });

    if (!tender) {
      throw new NotFoundException('Tender not found');
    }

    return tender;
  }

  async create(dto: CreateTenderDto, user: AuthenticatedUser) {
    const defaults = this.applyDateDefaults({});
    const code = dto.code ?? await this.generateTenderCode();
    const data = this.toTenderData(dto, user.id) as Prisma.TenderUncheckedCreateInput;
    return this.prisma.tender.create({
      data: {
        ...data,
        code,
        ...defaults,
        requestingAreaId: dto.requestingAreaId ?? undefined,
      },
    });
  }

  async update(id: string, dto: UpdateTenderDto) {
    await this.ensureTender(id);
    const data = this.toTenderData(dto) as Prisma.TenderUncheckedUpdateInput;
    return this.prisma.tender.update({
      where: { id },
      data,
    });
  }

  async publish(id: string) {
    await this.ensureTender(id);
    return this.prisma.tender.update({
      where: { id },
      data: {
        status: 'PUBLICADA',
        publishedAt: new Date(),
      },
    });
  }

  async close(id: string) {
    await this.ensureTender(id);
    return this.prisma.tender.update({
      where: { id },
      data: { status: 'CERRADA' },
    });
  }

  async createItem(tenderId: string, dto: CreateTenderItemDto) {
    await this.ensureTender(tenderId);
    return this.prisma.tenderItem.create({
      data: {
        tenderId,
        lot: dto.lot,
        description: dto.description,
        unit: dto.unit,
        quantity: dto.quantity,
        specs: dto.specs,
      },
    });
  }

  async findItems(tenderId: string, user: AuthenticatedUser) {
    await this.findOne(tenderId, user);
    return this.prisma.tenderItem.findMany({
      where: { tenderId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async ensureTender(id: string) {
    const tender = await this.prisma.tender.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!tender) {
      throw new NotFoundException('Tender not found');
    }
  }

  private toTenderData(dto: UpdateTenderDto, buyerId?: string) {
    if (dto.bidDeadline && Number.isNaN(Date.parse(dto.bidDeadline))) {
      throw new ForbiddenException('Invalid bid deadline');
    }

    return {
      code: dto.code,
      title: dto.title,
      description: dto.description,
      currency: dto.currency,
      requesterArea: dto.requesterArea,
      allowBidReplacement: dto.allowBidReplacement,
      buyerId,
      questionDeadline: dto.questionDeadline
        ? new Date(dto.questionDeadline)
        : undefined,
      bidDeadline: dto.bidDeadline ? new Date(dto.bidDeadline) : undefined,
      evaluationStart: dto.evaluationStart
        ? new Date(dto.evaluationStart)
        : undefined,
      estimatedAwardAt: dto.estimatedAwardAt
        ? new Date(dto.estimatedAwardAt)
        : undefined,
    };
  }

  private applyDateDefaults(data: Partial<Pick<Tender, 'bidDeadline' | 'questionDeadline' | 'createdAt'>>) {
    const now = new Date();
    const plus15 = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const plus30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const questionDeadline = data.questionDeadline ? undefined : plus15;
    const bidDeadline = data.bidDeadline ? undefined : plus30;

    const result: Record<string, unknown> = {};
    if (questionDeadline) {
      result.questionDeadline = new Date(new Date(questionDeadline).setHours(23, 59, 59, 999));
    }
    if (bidDeadline) {
      result.bidDeadline = new Date(new Date(bidDeadline).setHours(23, 59, 59, 999));
    }
    return result;
  }

  private async generateTenderCode(): Promise<string> {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const datePrefix = `PK-${day}${month}${year}`;

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const countToday = await this.prisma.tender.count({
      where: {
        code: { startsWith: datePrefix },
        createdAt: { gte: todayStart, lt: todayEnd },
      },
    });

    const suffix = String(countToday + 1).padStart(3, '0');
    return `${datePrefix}-${suffix}`;
  }

  private supplierTenderSelect() {
    return {
      id: true,
      code: true,
      title: true,
      description: true,
      status: true,
      currency: true,
      publishedAt: true,
      questionDeadline: true,
      bidDeadline: true,
      items: {
        where: { deletedAt: null },
      },
      documents: {
        where: { voidedAt: null, publishedAt: { not: null } },
        select: {
          id: true,
          type: true,
          version: true,
          title: true,
          publishedAt: true,
        },
      },
    } as const;
  }

  private internalTenderSelect() {
    return {
      id: true,
      code: true,
      title: true,
      description: true,
      status: true,
      currency: true,
      buyerId: true,
      requestingAreaId: true,
      requesterArea: true,
      requestingArea: { select: { id: true, code: true, name: true, status: true } },
      allowBidReplacement: true,
      publishedAt: true,
      questionDeadline: true,
      bidDeadline: true,
      evaluationStart: true,
      estimatedAwardAt: true,
      createdAt: true,
      updatedAt: true,
      items: { where: { deletedAt: null } },
      documents: { where: { voidedAt: null } },
    } as const;
  }
}
