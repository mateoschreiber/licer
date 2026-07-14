import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AuditAction } from '../common/decorators/audit-action.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CreateRequestingAreaDto } from './dto/create-requesting-area.dto';
import { UpdateRequestingAreaDto } from './dto/update-requesting-area.dto';
import { RequestingAreasService } from './requesting-areas.service';

@Controller('requesting-areas')
export class RequestingAreasController {
  constructor(private readonly requestingAreasService: RequestingAreasService) {}

  @Permissions('requesting-areas:read:internal')
  @Get()
  findAll() {
    return this.requestingAreasService.findAll();
  }

  @Permissions('requesting-areas:read:internal')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requestingAreasService.findOne(id);
  }

  @Permissions('requesting-areas:create:internal')
  @AuditAction({ action: 'REQUESTING_AREA_CREATE', entity: 'RequestingArea' })
  @Post()
  create(@Body() dto: CreateRequestingAreaDto) {
    return this.requestingAreasService.create(dto);
  }

  @Permissions('requesting-areas:update:internal')
  @AuditAction({ action: 'REQUESTING_AREA_UPDATE', entity: 'RequestingArea' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRequestingAreaDto) {
    return this.requestingAreasService.update(id, dto);
  }

  @Permissions('requesting-areas:delete:internal')
  @AuditAction({ action: 'REQUESTING_AREA_DELETE', entity: 'RequestingArea' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.requestingAreasService.remove(id);
  }
}
