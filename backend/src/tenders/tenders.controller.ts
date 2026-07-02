import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AuthenticatedUser } from '../common/auth/authenticated-user.interface';
import { AuditAction } from '../common/decorators/audit-action.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateTenderDto } from './dto/create-tender.dto';
import { CreateTenderItemDto } from './dto/create-tender-item.dto';
import { UpdateTenderDto } from './dto/update-tender.dto';
import { TendersService } from './tenders.service';

@Controller('tenders')
export class TendersController {
  constructor(private readonly tendersService: TendersService) {}

  @Permissions('tenders:read:published', 'tenders:read:internal')
  @Get()
  findAll(@Query() query: PaginationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.tendersService.findAll(query, user);
  }

  @Permissions('tenders:read:published', 'tenders:read:internal')
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.tendersService.findOne(id, user);
  }

  @Permissions('tenders:create:internal')
  @AuditAction({ action: 'TENDER_CREATE', entity: 'Tender' })
  @Post()
  create(@Body() dto: CreateTenderDto, @CurrentUser() user: AuthenticatedUser) {
    return this.tendersService.create(dto, user);
  }

  @Permissions('tenders:update:internal')
  @AuditAction({ action: 'TENDER_UPDATE', entity: 'Tender' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTenderDto) {
    return this.tendersService.update(id, dto);
  }

  @Permissions('tenders:publish:internal')
  @AuditAction({ action: 'TENDER_PUBLISH', entity: 'Tender' })
  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.tendersService.publish(id);
  }

  @Permissions('tenders:close:internal')
  @AuditAction({ action: 'TENDER_CLOSE', entity: 'Tender' })
  @Post(':id/close')
  close(@Param('id') id: string) {
    return this.tendersService.close(id);
  }

  @Permissions('tenders:create:internal')
  @Post(':id/items')
  createItem(@Param('id') id: string, @Body() dto: CreateTenderItemDto) {
    return this.tendersService.createItem(id, dto);
  }

  @Permissions('tenders:read:published', 'tenders:read:internal')
  @Get(':id/items')
  findItems(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.tendersService.findItems(id, user);
  }
}
