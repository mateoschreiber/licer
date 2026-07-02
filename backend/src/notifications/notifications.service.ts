import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../common/auth/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        supplierId: dto.supplierId,
        tenderId: dto.tenderId,
        channel: dto.channel,
        subject: dto.subject,
        body: dto.body,
      },
    });
  }

  findMine(user: AuthenticatedUser) {
    const filters: Array<{ userId?: string; supplierId?: string }> = [
      { userId: user.id },
    ];
    if (user.supplierId) {
      filters.push({ supplierId: user.supplierId });
    }

    return this.prisma.notification.findMany({
      where: {
        deletedAt: null,
        OR: filters,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
