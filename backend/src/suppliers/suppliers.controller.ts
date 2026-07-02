import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AuthenticatedUser } from '../common/auth/authenticated-user.interface';
import { AuditAction } from '../common/decorators/audit-action.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Public } from '../common/decorators/public.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RegisterSupplierDto } from './dto/register-supplier.dto';
import { SupplierActionDto } from './dto/supplier-action.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterSupplierDto) {
    return this.suppliersService.register(dto);
  }

  @Permissions('suppliers:read:own')
  @Get('me')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.suppliersService.findMine(user);
  }

  @Permissions('suppliers:update:own')
  @Patch('me')
  updateMine(
    @Body() dto: UpdateSupplierDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.suppliersService.update(user.supplierId ?? '', dto, user);
  }

  @Permissions('suppliers:read:internal')
  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.suppliersService.findAll(query);
  }

  @Permissions('suppliers:update:internal')
  @AuditAction({ action: 'SUPPLIER_UPDATE', entity: 'Supplier' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.suppliersService.update(id, dto, user);
  }

  @Permissions('suppliers:approve:internal')
  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: SupplierActionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.suppliersService.approve(id, dto, user);
  }

  @Permissions('suppliers:block:internal')
  @Post(':id/block')
  block(
    @Param('id') id: string,
    @Body() dto: SupplierActionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.suppliersService.block(id, dto, user);
  }
}
