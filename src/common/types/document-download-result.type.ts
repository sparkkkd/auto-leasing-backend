import { Document } from '@prisma/client';

export interface DocumentDownloadResult {
  fileBuffer: Buffer;
  document: Document;
}
