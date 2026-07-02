import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  expediente(tenderId: string) {
    return this.prisma.tender.findUniqueOrThrow({
      where: { id: tenderId },
      include: {
        items: true,
        documents: {
          select: {
            id: true,
            type: true,
            version: true,
            title: true,
            publishedAt: true,
            voidedAt: true,
            voidReason: true,
          },
        },
        questions: { include: { answer: true } },
        bids: {
          include: {
            supplier: true,
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
            scores: true,
          },
        },
        criteria: true,
        awards: true,
      },
    });
  }
}
