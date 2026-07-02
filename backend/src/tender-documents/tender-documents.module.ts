import { Module } from '@nestjs/common';
import { TenderDocumentsController } from './tender-documents.controller';
import { TenderDocumentsService } from './tender-documents.service';

@Module({
  controllers: [TenderDocumentsController],
  providers: [TenderDocumentsService],
  exports: [TenderDocumentsService],
})
export class TenderDocumentsModule {}
