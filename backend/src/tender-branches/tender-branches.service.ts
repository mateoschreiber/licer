import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenderBranchDto } from './dto/create-tender-branch.dto';
@Injectable()
export class TenderBranchesService {
  constructor(private readonly prisma: PrismaService) {}
  findAll() {
    return this.prisma.tenderBranch.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }
  create(dto: CreateTenderBranchDto) {
    return this.prisma.tenderBranch.create({ data: { name: dto.name.trim() } });
  }
  async update(id: string, dto: CreateTenderBranchDto) {
    const item = await this.prisma.tenderBranch.findFirst({ where: { id, deletedAt: null } });
    if (!item) throw new NotFoundException('Registro no encontrado');
    return this.prisma.tenderBranch.update({ where: { id }, data: { name: dto.name.trim() } });
  }
  async remove(id: string) {
    const c = await this.prisma.tenderBranch.findFirst({ where: { id, deletedAt: null } });
    if (!c) throw new NotFoundException('Sucursal no encontrada');
    if (await this.prisma.tender.count({ where: { branchId: id, deletedAt: null } }))
      throw new BadRequestException('Sucursal en uso');
    return this.prisma.tenderBranch.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
