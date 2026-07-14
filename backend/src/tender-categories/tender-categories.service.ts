import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenderCategoryDto } from './dto/create-tender-category.dto';
@Injectable()
export class TenderCategoriesService {
  constructor(private readonly prisma: PrismaService) {}
  findAll() {
    return this.prisma.tenderCategory.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }
  create(dto: CreateTenderCategoryDto) {
    return this.prisma.tenderCategory.create({ data: { name: dto.name.trim() } });
  }
  async update(id: string, dto: CreateTenderCategoryDto) {
    const item = await this.prisma.tenderCategory.findFirst({ where: { id, deletedAt: null } });
    if (!item) throw new NotFoundException('Registro no encontrado');
    return this.prisma.tenderCategory.update({ where: { id }, data: { name: dto.name.trim() } });
  }
  async remove(id: string) {
    const c = await this.prisma.tenderCategory.findFirst({ where: { id, deletedAt: null } });
    if (!c) throw new NotFoundException('Categoria no encontrada');
    if (await this.prisma.tender.count({ where: { categoryId: id, deletedAt: null } }))
      throw new BadRequestException('Categoria en uso');
    return this.prisma.tenderCategory.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
