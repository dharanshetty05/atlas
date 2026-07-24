import { pino } from "pino";
import fs from "fs";
import path from "path";

const logger = pino({ name: "StorageService" });

const STORAGE_ROOT = process.env.LOCAL_STORAGE_ROOT ?? path.join(process.cwd(), ".storage");

/**
 * Infrastructure interface representing object storage capabilities (`AWS S3`, `Cloudflare R2`, or local `Mock`).
 */
export interface IStorageService {
  /**
   * Generates a URL for reading/previewing a document (`ResponseContentDisposition: inline`).
   */
  generateReadUrl(
    storageKey: string,
    originalFilename: string,
    mimeType: string
  ): Promise<string>;

  /**
   * Generates a URL specifically enforcing attachment download (`ResponseContentDisposition: attachment`).
   */
  generateDownloadUrl(
    storageKey: string,
    originalFilename: string
  ): Promise<string>;

  /**
   * Uploads an object to the underlying storage.
   */
  uploadObject(
    storageKey: string,
    file: Buffer,
    mimeType: string
  ): Promise<void>;

  /**
   * Deletes an object from the underlying storage.
   */
  deleteObject(storageKey: string): Promise<void>;
}

export class StorageService implements IStorageService {
  // To use only if S3 is implemented
  // private bucketName = process.env.AWS_S3_BUCKET ?? "atlas-local-bucket";
  // private region = process.env.AWS_REGION ?? "us-east-1";

  /**
   * Helper to return sample content URLs when running locally or during demo/testing
   * when AWS S3 environment variables are not configured.
   */
  private getLocalSampleDataUrl(mimeType: string, originalFilename: string): string {
    const cleanMime = mimeType.toLowerCase();

    if (cleanMime === "application/pdf" || originalFilename.endsWith(".pdf")) {
      return "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf";
    }

    if (cleanMime.startsWith("image/")) {
      return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80";
    }

    if (cleanMime.startsWith("text/")) {
      const sampleText = `================================================================================
ATLAS KNOWLEDGE PLATFORM - TECHNICAL DOCUMENTATION
================================================================================
Document Title: ${originalFilename}
MIME Type: ${mimeType}
Status: READY

1. ARCHITECTURAL OVERVIEW
Atlas is an enterprise-grade internal knowledge management platform built with:
- Next.js 15 App Router & Server Components
- React 19 & TypeScript
- Prisma 7 with PostgreSQL
- Better Auth authentication

2. DOCUMENT VIEWER CAPABILITIES (V1)
- Clean, reliable PDF inspection via PDF.js
- Responsive diagram and image inspection
- Scrollable preformatted text viewing
- Graceful download support for binary files
================================================================================`;
      return `data:${mimeType};charset=utf-8,${encodeURIComponent(sampleText)}`;
    }

    return `https://example.com/download-mock/${encodeURIComponent(originalFilename)}`;
  }

  async generateReadUrl(
    storageKey: string,
    originalFilename: string,
    mimeType: string
  ): Promise<string> {
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      try {
        // In production with S3/R2 configured:
        // const command = new GetObjectCommand({
        //   Bucket: this.bucketName,
        //   Key: storageKey,
        //   ResponseContentType: mimeType,
        //   ResponseContentDisposition: `inline; filename="${originalFilename}"`,
        // });
        // return await getSignedUrl(s3Client, command, { expiresIn: 900 });
      } catch (err) {
        logger.error({ err, storageKey }, "Failed to generate S3 read URL");
      }
    }

    logger.info({ storageKey, mimeType }, "Generating local development read URL");
    
    try {
      const fullPath = path.join(STORAGE_ROOT, storageKey);
      const fileBuffer = await fs.promises.readFile(fullPath);
      return `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
    } catch (error) {
      logger.warn({ storageKey, error }, "Local file not found, falling back to mock data");
      return this.getLocalSampleDataUrl(mimeType, originalFilename);
    }
  }

  async generateDownloadUrl(
    storageKey: string,
    originalFilename: string
  ): Promise<string> {
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      try {
        // In production with S3/R2 configured:
        // const command = new GetObjectCommand({
        //   Bucket: this.bucketName,
        //   Key: storageKey,
        //   ResponseContentDisposition: `attachment; filename="${originalFilename}"`,
        // });
        // return await getSignedUrl(s3Client, command, { expiresIn: 900 });
      } catch (err) {
        logger.error({ err, storageKey }, "Failed to generate S3 download URL");
      }
    }

    logger.info({ storageKey, originalFilename }, "Generating local development download URL");
    
    try {
      const fullPath = path.join(STORAGE_ROOT, storageKey);
      const fileBuffer = await fs.promises.readFile(fullPath);
      return `data:application/octet-stream;base64,${fileBuffer.toString("base64")}`;
    } catch (error) {
      logger.warn({ storageKey, error }, "Local file not found, falling back to mock data");
      return this.getLocalSampleDataUrl("application/octet-stream", originalFilename);
    }
  }

  async uploadObject(
    storageKey: string,
    file: Buffer,
    mimeType: string
  ): Promise<void> {
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      // In production with S3/R2 configured:
      // return s3Client.send(new PutObjectCommand({ ... }))
      return;
    }

    logger.info({ storageKey, mimeType }, "Uploading file to local storage");
    const fullPath = path.join(STORAGE_ROOT, storageKey);
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, file);
  }

  async deleteObject(storageKey: string): Promise<void> {
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      // In production with S3/R2 configured:
      // return s3Client.send(new DeleteObjectCommand({ ... }))
      return;
    }

    logger.info({ storageKey }, "Deleting file from local storage");
    const fullPath = path.join(STORAGE_ROOT, storageKey);
    try {
      await fs.promises.unlink(fullPath);
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        logger.error({ storageKey, error }, "Failed to delete local file");
        throw error;
      }
    }
  }
}

export const storageService = new StorageService();
