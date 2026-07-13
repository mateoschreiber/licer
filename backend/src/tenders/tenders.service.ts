import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  async create(dto: CreateTenderDto, user: AuthenticatedUser) {
    const dates = this.resolveTenderDates(dto);
    const code = dto.code ?? await this.generateTenderCode();
    const data = this.toTenderData(dto, user.id) as Prisma.TenderUncheckedCreateInput;
    return this.prisma.tender.create({
      data: {
        ...data,
        code,
        ...dates,
        requestingAreaId: dto.requestingAreaId ?? undefined,
      },
    });
  }

  async update(id: string, dto: UpdateTenderDto) {
    const tender = await this.ensureTender(id, {
      id: true,
      createdAt: true,
      publishedAt: true,
      questionDeadline: true,
      bidDeadline: true,
    });
    const data = this.toTenderData(dto) as Prisma.TenderUncheckedUpdateInput;
    this.assertDateOrder({
      baseDate: dto.publishedAt ? this.parseDate(dto.publishedAt, 'Fecha base invalida') : (tender.publishedAt ?? tender.createdAt),
      questionDeadline: dto.questionDeadline ? this.parseDate(dto.questionDeadline, 'Limite de consultas invalido') : tender.questionDeadline,
      bidDeadline: dto.bidDeadline ? this.parseDate(dto.bidDeadline, 'Limite de ofertas invalido') : tender.bidDeadline,
    });
    return this.prisma.tender.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.ensureTender(id);
    return this.prisma.tender.update({
      where: { id },
      data: { deletedAt: new Date() },
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
        referenceBrandModel: dto.referenceBrandModel,
        allowsEquivalent: dto.allowsEquivalent ?? false,
        minimumWarranty: dto.minimumWarranty,
        warrantyDocumentRequired: dto.warrantyDocumentRequired ?? false,
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

  private async ensureTender<T extends Prisma.TenderSelect>(
    id: string,
    select?: T,
  ): Promise<Prisma.TenderGetPayload<{ select: T }>> {
    const tender = await this.prisma.tender.findFirst({
      where: { id, deletedAt: null },
      select: select ?? ({ id: true } as T),
    });
    if (!tender) {
      throw new NotFoundException('Tender not found');
    }
    return tender as Prisma.TenderGetPayload<{ select: T }>;
  }

  private toTenderData(dto: UpdateTenderDto, buyerId?: string) {
    return {
      code: dto.code,
      title: dto.title,
      description: dto.description,
      currency: dto.currency,
      categoryId: dto.categoryId,
      branchId: dto.branchId,
      responsibleEmail: dto.responsibleEmail,
      responseDeadline: dto.responseDeadline ? this.parseDate(dto.responseDeadline, 'Limite de respuestas invalido') : undefined,
      vatIncluded: dto.vatIncluded,
      paymentMethod: dto.paymentMethod,
      paymentTerms: dto.paymentTerms,
      offerValidityUntil: dto.offerValidityUntil ? this.parseDate(dto.offerValidityUntil, 'Validez invalida') : undefined,
      requesterArea: dto.requesterArea,
      allowBidReplacement: dto.allowBidReplacement,
      buyerId,
      publishedAt: dto.publishedAt
        ? this.parseDate(dto.publishedAt, 'Fecha base invalida')
        : undefined,
      questionDeadline: dto.questionDeadline
        ? this.parseDate(dto.questionDeadline, 'Limite de consultas invalido')
        : undefined,
      bidDeadline: dto.bidDeadline
        ? this.parseDate(dto.bidDeadline, 'Limite de ofertas invalido')
        : undefined,
      evaluationStart: dto.evaluationStart
        ? this.parseDate(dto.evaluationStart, 'Fecha de evaluacion invalida')
        : undefined,
      estimatedAwardAt: dto.estimatedAwardAt
        ? this.parseDate(dto.estimatedAwardAt, 'Fecha estimada de adjudicacion invalida')
        : undefined,
    };
  }

  private resolveTenderDates(dto: CreateTenderDto) {
    const baseDate = dto.publishedAt
      ? this.parseDate(dto.publishedAt, 'Fecha base invalida')
      : new Date();
    const questionDeadline = dto.questionDeadline
      ? this.parseDate(dto.questionDeadline, 'Limite de consultas invalido')
      : this.endOfDay(this.addDays(baseDate, 15));
    const bidDeadline = dto.bidDeadline
      ? this.parseDate(dto.bidDeadline, 'Limite de ofertas invalido')
      : this.endOfDay(this.addDays(baseDate, 30));

    this.assertDateOrder({ baseDate, questionDeadline, bidDeadline });

    return {
      publishedAt: dto.publishedAt ? baseDate : undefined,
      questionDeadline,
      bidDeadline,
    };
  }

  private parseDate(value: string, message: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(message);
    }
    return date;
  }

  private assertDateOrder(dates: {
    baseDate: Date;
    questionDeadline: Date | null;
    bidDeadline: Date;
  }) {
    if (dates.questionDeadline && dates.questionDeadline < dates.baseDate) {
      throw new BadRequestException('El limite de consultas no puede ser anterior a la fecha base');
    }
    if (dates.questionDeadline && dates.bidDeadline < dates.questionDeadline) {
      throw new BadRequestException('El limite de ofertas no puede ser anterior al limite de consultas');
    }
    if (!dates.questionDeadline && dates.bidDeadline < dates.baseDate) {
      throw new BadRequestException('El limite de ofertas no puede ser anterior a la fecha base');
    }
  }

  private addDays(date: Date, days: number) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private endOfDay(date: Date) {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  private async generateTenderCode(): Promise<string> {
    const now = new Date();
    const yearPrefix = String(now.getFullYear()).slice(-3);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const countToday = await this.prisma.tender.count({ where: { createdAt: { gte: todayStart, lt: todayEnd } } });
    const suffix = String(countToday + 1).padStart(3, '0');
    return yearPrefix + '-' + suffix;
  }

  private supplierTenderSelect() {
    return {
      id: true,
      code: true,
      title: true,
      description: true,
      status: true,
      currency: true,
      category: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
      requestingArea: { select: { id: true, code: true, name: true } },
      responsibleEmail: true,
      responseDeadline: true,
      vatIncluded: true,
      paymentMethod: true,
      paymentTerms: true,
      allowBidReplacement: true,
      publishedAt: true,
      questionDeadline: true,
      bidDeadline: true,
      items: {
        where: { deletedAt: null },
      },
      documents: {
        where: { voidedAt: null },
        select: {
          id: true,
          fileId: true,
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
      categoryId: true,
      category: { select: { id: true, name: true } },
      branchId: true,
      branch: { select: { id: true, name: true } },
      responsibleEmail: true,
      responseDeadline: true,
      vatIncluded: true,
      paymentMethod: true,
      paymentTerms: true,
      offerValidityUntil: true,
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
