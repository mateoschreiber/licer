import { Injectable } from '@nestjs/common';
import { AuditResult, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';

export interface AuditLogInput {
  actorId?: string;
  role?: string;
  ip?: string;
  action: string;
  entity: string;
  entityId?: string;
  result: AuditResult;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput) {
    return this.prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        role: input.role,
        ip: input.ip,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        result: input.result,
        metadata: input.metadata,
      },
    });
  }

  findAll(query: PaginationDto) {
    const skip = (query.page - 1) * query.pageSize;
    return this.prisma.auditLog.findMany({
      where: query.search
        ? {
            OR: [
              { action: { contains: query.search, mode: 'insensitive' } },
              { entity: { contains: query.search, mode: 'insensitive' } },
              { entityId: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.pageSize,
    });
  }
}
