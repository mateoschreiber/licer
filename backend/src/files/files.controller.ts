import {
  Controller,
  BadRequestException,
  Post,
  UploadedFile,
  UseInterceptors,
  Get,
  NotFoundException,
  Param,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { createReadStream, existsSync } from 'fs';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthenticatedUser } from '../common/auth/authenticated-user.interface';
import { RequestWithUser } from '../common/auth/request-with-user.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Permissions('tender-documents:create:internal', 'suppliers:update:own')
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }))
  async upload(@UploadedFile() file: any, @CurrentUser() user: AuthenticatedUser) {
    if (!file) throw new BadRequestException('Archivo requerido o superior a 2 MB');
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('El archivo supera el limite maximo de 2 MB');
    }
    return this.filesService.storeUpload(file, user.id);
  }

  @Permissions('files:download:own', 'files:download:internal')
  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const descriptor = await this.filesService.prepareDownload(id, user, request.ip);

    if (!existsSync(descriptor.storagePath)) {
      throw new NotFoundException('Stored file is not available');
    }

    response.setHeader('Content-Type', descriptor.mime);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${descriptor.originalName.replace(/"/g, '')}"`,
    );
    response.setHeader('Content-Length', descriptor.size.toString());

    return new StreamableFile(createReadStream(descriptor.storagePath));
  }
}
