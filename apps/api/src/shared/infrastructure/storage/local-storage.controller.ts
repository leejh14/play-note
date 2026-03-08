import { Controller, Get, HttpCode, Put, Query, Req, Res } from '@nestjs/common';
import { Public } from '@auth/decorators/public.decorator';
import type { Request, Response } from 'express';
import { S3StorageService } from './s3-storage.service';

@Public()
@Controller('storage')
export class LocalStorageController {
  constructor(private readonly storageService: S3StorageService) {}

  @Put('upload')
  @HttpCode(200)
  async upload(
    @Query('key') key: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.storageService.saveLocalObject(key, req);
    res.send();
  }

  @Get('object')
  async getObject(
    @Query('key') key: string,
    @Query('contentType') contentType: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const { filePath, contentType: resolvedContentType } =
      await this.storageService.getLocalObject(key, contentType);

    if (resolvedContentType) {
      res.setHeader('content-type', resolvedContentType);
    }

    res.sendFile(filePath);
  }
}
