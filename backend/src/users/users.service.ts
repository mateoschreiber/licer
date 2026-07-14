import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: PaginationDto) {
    const skip = (query.page - 1) * query.pageSize;
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(query.search
          ? {
              OR: [
                { email: { contains: query.search, mode: 'insensitive' } },
                { username: { contains: query.search, mode: 'insensitive' } },
                { name: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: this.safeUserSelect(),
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.pageSize,
    });
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 12);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        name: dto.name,
        passwordHash,
        status: dto.status ?? 'ACTIVE',
        supplierId: dto.supplierId,
        roles: {
          create: dto.roleIds.map((roleId) => ({ roleId })),
        },
      },
      select: this.safeUserSelect(),
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 12) : undefined;

    return this.prisma.$transaction(async (tx) => {
      if (dto.roleIds) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.createMany({
          data: dto.roleIds.map((roleId) => ({ userId: id, roleId })),
          skipDuplicates: true,
        });
      }

      return tx.user.update({
        where: { id },
        data: {
          email: dto.email,
          username: dto.username,
          name: dto.name,
          passwordHash,
          status: dto.status,
          supplierId: dto.supplierId,
        },
        select: this.safeUserSelect(),
      });
    });
  }

  private safeUserSelect() {
    return {
      id: true,
      email: true,
      username: true,
      name: true,
      status: true,
      supplierId: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      roles: {
        include: {
          role: true,
        },
      },
    } as const;
  }
}
