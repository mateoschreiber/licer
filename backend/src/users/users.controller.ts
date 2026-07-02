import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AuditAction } from '../common/decorators/audit-action.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Permissions('users:read:internal')
  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.usersService.findAll(query);
  }

  @Permissions('users:create:internal')
  @AuditAction({ action: 'USER_CREATE', entity: 'User' })
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Permissions('users:update:internal')
  @AuditAction({ action: 'USER_UPDATE', entity: 'User' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }
}
