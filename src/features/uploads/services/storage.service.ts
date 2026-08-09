import fs from "fs";
import { createReadStream } from "fs";
import path from "path";
import type { ReadStream } from "fs";
import { pino } from "pino";

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

  /**
   * Retrieves an object from storage as a Buffer.
   * Useful for internal processing tasks like extraction.
   */
  getObjectBuffer(storageKey: string): Promise<Buffer>;

  /**
   * Retrieves an object from storage as a readable stream.
   * Used by authorized HTTP delivery routes to avoid loading entire files into memory.
   */
  getObjectStream(storageKey: string): Promise<StorageObjectStream>;
}

export interface StorageObjectStream {
  stream: ReadStream;
  size: number;
}

export class StorageService implements IStorageService {
  // To use only if S3 is implemented
  // private bucketName = process.env.AWS_S3_BUCKET ?? "atlas-local-bucket";
  // private region = process.env.AWS_REGION ?? "us-east-1";

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

    throw new Error(
      "generateReadUrl is not supported for local storage; use the authorized document content API."
    );
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

    throw new Error(
      "generateDownloadUrl is not supported for local storage; use the authorized document content API."
    );
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
    const fullPath = path.resolve(STORAGE_ROOT, storageKey);
    if (!fullPath.startsWith(path.resolve(STORAGE_ROOT))) {
      throw new Error("Invalid storage key");
    }
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
    const fullPath = path.resolve(STORAGE_ROOT, storageKey);
    if (!fullPath.startsWith(path.resolve(STORAGE_ROOT))) {
      throw new Error("Invalid storage key");
    }
    try {
      await fs.promises.unlink(fullPath);
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        logger.error({ storageKey, error }, "Failed to delete local file");
        throw error;
      }
    }
  }

  async getObjectStream(storageKey: string): Promise<StorageObjectStream> {
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("S3 getObjectStream not implemented in this phase");
    }

    logger.info({ storageKey }, "Retrieving file stream from local storage");
    const fullPath = this.resolveStoragePath(storageKey);

    try {
      const stats = await fs.promises.stat(fullPath);
      return {
        stream: createReadStream(fullPath),
        size: stats.size,
      };
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        throw new Error(`Storage object not found: ${storageKey}`);
      }

      logger.error({ storageKey, error }, "Failed to read local file stream");
      throw error;
    }
  }

  async getObjectBuffer(storageKey: string): Promise<Buffer> {
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("S3 getObjectBuffer not implemented in this phase");
    }

    logger.info({ storageKey }, "Retrieving file buffer from local storage");
    const fullPath = this.resolveStoragePath(storageKey);

    try {
      return await fs.promises.readFile(fullPath);
    } catch (error) {
      logger.error({ storageKey, error }, "Failed to read local file buffer");
      throw error;
    }
  }

  private resolveStoragePath(storageKey: string): string {
    const fullPath = path.resolve(STORAGE_ROOT, storageKey);
    if (!fullPath.startsWith(path.resolve(STORAGE_ROOT))) {
      throw new Error("Invalid storage key");
    }

    return fullPath;
  }
}

export const storageService = new StorageService();
