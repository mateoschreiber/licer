import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

  create(dto: CreateTenderDto, user: AuthenticatedUser) {
    const data = this.toTenderData(dto, user.id) as Prisma.TenderUncheckedCreateInput;
    return this.prisma.tender.create({
      data,
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
      requesterArea: true,
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
