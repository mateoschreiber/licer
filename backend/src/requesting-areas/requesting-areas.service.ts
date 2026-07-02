import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRequestingAreaDto } from './dto/create-requesting-area.dto';
import { UpdateRequestingAreaDto } from './dto/update-requesting-area.dto';

@Injectable()
export class RequestingAreasService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.requestingArea.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const area = await this.prisma.requestingArea.findFirst({
      where: { id, deletedAt: null },
    });
    if (!area) {
      throw new NotFoundException('Requesting area not found');
    }
    return area;
  }

  async create(dto: CreateRequestingAreaDto) {
    const existing = await this.prisma.requestingArea.findFirst({
      where: { name: dto.name, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('Requesting area name already exists');
    }
    return this.prisma.requestingArea.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        status: dto.status ?? 'ACTIVA',
      },
    });
  }

  async update(id: string, dto: UpdateRequestingAreaDto) {
    const area = await this.prisma.requestingArea.findFirst({
      where: { id, deletedAt: null },
    });
    if (!area) {
      throw new NotFoundException('Requesting area not found');
    }

    if (dto.name && dto.name !== area.name) {
      const duplicate = await this.prisma.requestingArea.findFirst({
        where: { name: dto.name, deletedAt: null, id: { not: id } },
      });
      if (duplicate) {
        throw new ConflictException('Requesting area name already exists');
      }
    }

    return this.prisma.requestingArea.update({
      where: { id },
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        status: dto.status,
      },
    });
  }

  async remove(id: string) {
    const area = await this.prisma.requestingArea.findFirst({
      where: { id, deletedAt: null },
    });
    if (!area) {
      throw new NotFoundException('Requesting area not found');
    }
    return this.prisma.requestingArea.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVA' },
    });
  }
}
