import { Controller, Get, Param } from '@nestjs/common';
import { Permissions } from '../common/decorators/permissions.decorator';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Permissions('reports:read:internal')
  @Get('tenders/:id/expediente')
  expediente(@Param('id') id: string) {
    return this.reportsService.expediente(id);
  }
}
