import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AuditAction } from '../common/decorators/audit-action.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Permissions('roles:read:internal')
  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Permissions('roles:create:internal')
  @AuditAction({ action: 'ROLE_CREATE', entity: 'Role' })
  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Permissions('roles:update:internal')
  @AuditAction({ action: 'ROLE_UPDATE', entity: 'Role' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }
}
