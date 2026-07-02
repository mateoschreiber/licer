import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../common/auth/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCriteriaDto } from './dto/create-criteria.dto';
import { CreateScoreDto } from './dto/create-score.dto';

@Injectable()
export class EvaluationsService {
  constructor(private readonly prisma: PrismaService) {}

  findByTender(tenderId: string) {
    return this.prisma.evaluationCriteria.findMany({
      where: { tenderId, deletedAt: null },
      include: { scores: true },
      orderBy: [{ category: 'asc' }, { createdAt: 'asc' }],
    });
  }

  createCriteria(dto: CreateCriteriaDto) {
    return this.prisma.evaluationCriteria.create({
      data: dto,
    });
  }

  score(dto: CreateScoreDto, user: AuthenticatedUser) {
    return this.prisma.evaluationScore.upsert({
      where: {
        bidId_criteriaId_evaluatorId: {
          bidId: dto.bidId,
          criteriaId: dto.criteriaId,
          evaluatorId: user.id,
        },
      },
      update: {
        score: dto.score,
        comment: dto.comment,
      },
      create: {
        bidId: dto.bidId,
        criteriaId: dto.criteriaId,
        evaluatorId: user.id,
        score: dto.score,
        comment: dto.comment,
      },
    });
  }
}
