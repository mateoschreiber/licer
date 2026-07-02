import { Controller, Get, Query } from '@nestjs/common';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuditService } from './audit.service';

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Permissions('audit:read:internal')
  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.auditService.findAll(query);
  }
}
