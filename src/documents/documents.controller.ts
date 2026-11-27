import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DocumentsService } from './documents.service';
import { FindAllDocumentsDto, UploadDocumentDto } from './dto';
import { DocumentType, UserRole } from '@prisma/client';
import { RolesGuard } from 'src/auth/guards';
import { Roles } from 'src/auth/decorators';

import type { Response } from 'express';
import type {
  DocumentDownloadResult,
  UploadedFile as UploadedFileDocument,
} from 'src/common/types';
import { ExpiringInsuranceDto } from './dto/expiring-insurance.dto';

@Controller('documents')
@UseGuards(RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
      },
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          callback(
            new BadRequestException('Разрешены только PDF, JPG и PNG файлы'),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  upload(
    @UploadedFile() file: UploadedFileDocument,
    @Body() uploadDocumentDto: UploadDocumentDto,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не был загружен');
    }

    return this.documentsService.upload(file, uploadDocumentDto);
  }

  @Get('insurance/expiring')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  getExpiringInsurance(
    @Query('days') days?: string,
  ): Promise<ExpiringInsuranceDto[]> {
    const daysThreshold = days ? Number(days) : 7;
    return this.documentsService.getExpiringInsurance(daysThreshold);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  findAll(@Query() query: FindAllDocumentsDto) {
    return this.documentsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Get(':id/download')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  async download(@Param('id') id: string, @Res() res: Response) {
    const result: DocumentDownloadResult =
      await this.documentsService.download(id);

    res.set({
      'Content-Type': result.document.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(result.document.originalName)}"`,
      'Content-Length': result.fileBuffer.length,
    });

    res.send(result.fileBuffer);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
