import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  create(dto: CreateRoleDto) {
    return this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        permissions: {
          create: dto.permissionIds.map((permissionId) => ({ permissionId })),
        },
      },
      include: { permissions: { include: { permission: true } } },
    });
  }

  async update(id: string, dto: UpdateRoleDto) {
    const existing = await this.prisma.role.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Rol no encontrado');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.permissionIds) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        await tx.rolePermission.createMany({
          data: dto.permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.role.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
        },
        include: { permissions: { include: { permission: true } } },
      });
    });
  }
}
