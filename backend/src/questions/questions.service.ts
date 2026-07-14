import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../common/auth/authenticated-user.interface';
import { ROLES } from '../common/constants/roles';
import { PrismaService } from '../prisma/prisma.service';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { CreateQuestionDto } from './dto/create-question.dto';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateQuestionDto, user: AuthenticatedUser) {
    if (!user.supplierId) {
      throw new ForbiddenException('Supplier user required');
    }

    const [supplier, tender] = await Promise.all([
      this.prisma.supplier.findUnique({ where: { id: user.supplierId } }),
      this.prisma.tender.findUnique({ where: { id: dto.tenderId } }),
    ]);

    if (!supplier || supplier.status !== 'ACTIVO') {
      throw new ForbiddenException('Supplier must be ACTIVO to ask questions');
    }
    if (!tender || tender.deletedAt || tender.status === 'BORRADOR') {
      throw new NotFoundException('Tender not found');
    }
    if (tender.questionDeadline && tender.questionDeadline.getTime() < Date.now()) {
      throw new ForbiddenException('Question deadline is closed');
    }

    return this.prisma.question.create({
      data: {
        tenderId: dto.tenderId,
        supplierId: user.supplierId,
        userId: user.id,
        text: dto.text,
      },
      include: { answer: true },
    });
  }

  findAll(user: AuthenticatedUser, tenderId?: string) {
    const supplierView = user.roles.includes(ROLES.PROVEEDOR);
    const where: Prisma.QuestionWhereInput = {
      deletedAt: null,
      tenderId,
      ...(supplierView ? { supplierId: user.supplierId ?? 'none' } : {}),
    };

    return this.prisma.question.findMany({
      where,
      include: {
        answer: true,
        tender: { select: { id: true, code: true, title: true } },
        ...(supplierView ? {} : { supplier: true, user: true }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const supplierView = user.roles.includes(ROLES.PROVEEDOR);
    const question = await this.prisma.question.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(supplierView ? { supplierId: user.supplierId ?? 'none' } : {}),
      },
      include: {
        answer: { include: { author: { select: { name: true } } } },
        tender: { select: { id: true, code: true, title: true } },
        supplier: { select: { legalName: true, ruc: true } },
        user: { select: { name: true } },
      },
    });
    if (!question) throw new NotFoundException('Question not found');
    return question;
  }

  async answer(id: string, dto: AnswerQuestionDto, user: AuthenticatedUser) {
    const question = await this.prisma.question.findFirst({
      where: { id, deletedAt: null },
    });
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const answer = await tx.answer.upsert({
        where: { questionId: id },
        update: {
          text: dto.text,
          authorId: user.id,
          publishedAt: new Date(),
        },
        create: {
          questionId: id,
          tenderId: question.tenderId,
          text: dto.text,
          authorId: user.id,
          publishedAt: new Date(),
        },
      });

      await tx.question.update({
        where: { id },
        data: { status: 'RESPONDIDA' },
      });

      return answer;
    });
  }
}
