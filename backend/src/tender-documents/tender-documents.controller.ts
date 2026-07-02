import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AuthenticatedUser } from '../common/auth/authenticated-user.interface';
import { AuditAction } from '../common/decorators/audit-action.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CreateTenderDocumentDto } from './dto/create-tender-document.dto';
import { VoidTenderDocumentDto } from './dto/void-tender-document.dto';
import { TenderDocumentsService } from './tender-documents.service';

@Controller('tender-documents')
export class TenderDocumentsController {
  constructor(private readonly documentsService: TenderDocumentsService) {}

  @Permissions('tender-documents:read:published', 'tender-documents:read:internal')
  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('tenderId') tenderId?: string,
  ) {
    return this.documentsService.findAll(user, tenderId);
  }

  @Permissions('tender-documents:create:internal')
  @AuditAction({ action: 'TENDER_DOCUMENT_CREATE', entity: 'TenderDocument' })
  @Post()
  create(@Body() dto: CreateTenderDocumentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.create(dto, user);
  }

  @Permissions('tender-documents:void:internal')
  @AuditAction({ action: 'TENDER_DOCUMENT_VOID', entity: 'TenderDocument' })
  @Post(':id/void')
  void(@Param('id') id: string, @Body() dto: VoidTenderDocumentDto) {
    return this.documentsService.void(id, dto);
  }
}
