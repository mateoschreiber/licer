import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { createReadStream, existsSync } from 'fs';
import { Response } from 'express';
import { AuthenticatedUser } from '../common/auth/authenticated-user.interface';
import { RequestWithUser } from '../common/auth/request-with-user.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Permissions('files:download:own', 'files:download:internal')
  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const descriptor = await this.filesService.prepareDownload(
      id,
      user,
      request.ip,
    );

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
