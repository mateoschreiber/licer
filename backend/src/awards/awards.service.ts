import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../common/auth/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAwardDto } from './dto/create-award.dto';
import { DecisionDto } from './dto/decision.dto';

@Injectable()
export class AwardsService {
  constructor(private readonly prisma: PrismaService) {}

  async award(dto: CreateAwardDto, user: AuthenticatedUser) {
    return this.prisma.$transaction(async (tx) => {
      const award = await tx.award.create({
        data: {
          tenderId: dto.tenderId,
          supplierId: dto.supplierId,
          bidId: dto.bidId,
          amount: dto.amount,
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
