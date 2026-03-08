import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createWriteStream } from 'node:fs';
import { mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import {
  buildLocalObjectUrl,
  buildLocalUploadUrl,
  isCredentialsProviderError,
  isLocalStorageKey,
  resolveApiBaseUrl,
  resolveLocalStoragePath,
  resolveLocalStorageRoot,
  toLocalStorageKey,
} from './storage.utils';

@Injectable()
export class S3StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly apiBaseUrl: string;
  private readonly localStorageRoot: string;

  constructor(private readonly config: ConfigService) {
    this.region = this.config.get<string>('AWS_REGION') ?? 'us-east-1';
    this.bucket = this.config.get<string>('S3_BUCKET') ?? 'playnote-attachments';
    this.apiBaseUrl = resolveApiBaseUrl(
      this.config.get<string>('API_BASE_URL'),
      this.config.get<string | number>('API_PORT'),
    );
    this.localStorageRoot = resolveLocalStorageRoot(
      this.config.get<string>('LOCAL_STORAGE_DIR'),
    );
    this.client = new S3Client({
      region: this.region,
      credentials: this.config.get('AWS_ACCESS_KEY_ID')
        ? {
            accessKeyId: this.config.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
            secretAccessKey: this.config.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
          }
        : undefined,
    });
  }

  async createUploadTarget(
    key: string,
    contentType: string,
    expiresIn: number = 900,
  ): Promise<{ uploadId: string; presignedUrl: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    try {
      const presignedUrl = await getSignedUrl(this.client, command, { expiresIn });
      return {
        uploadId: key,
        presignedUrl,
      };
    } catch (error) {
      if (!isCredentialsProviderError(error)) {
        throw error;
      }

      return {
        uploadId: toLocalStorageKey(key),
        presignedUrl: buildLocalUploadUrl(this.apiBaseUrl, key),
      };
    }
  }

  async getSignedUrl(
    key: string,
    contentType?: string,
    expiresIn: number = 900,
  ): Promise<string> {
    if (isLocalStorageKey(key)) {
      return buildLocalObjectUrl(this.apiBaseUrl, key, contentType);
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }

  async deleteObject(key: string): Promise<void> {
    if (isLocalStorageKey(key)) {
      await rm(this.resolveLocalStoragePath(key), { force: true });
      return;
    }

    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  async deleteObjects(keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    const localKeys = keys.filter((key) => isLocalStorageKey(key));
    const remoteKeys = keys.filter((key) => !isLocalStorageKey(key));

    await Promise.all(
      localKeys.map(async (key) => {
        await rm(this.resolveLocalStoragePath(key), { force: true });
      }),
    );

    if (remoteKeys.length === 0) {
      return;
    }

    await this.client.send(
      new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: remoteKeys.map((Key) => ({ Key })),
          Quiet: true,
        },
      }),
    );
  }

  async saveLocalObject(key: string, body: NodeJS.ReadableStream): Promise<void> {
    const filePath = this.resolveLocalStoragePath(key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await pipeline(body, createWriteStream(filePath));
  }

  async getLocalObject(
    key: string,
    contentType?: string,
  ): Promise<{ filePath: string; contentType: string | null }> {
    const filePath = this.resolveLocalStoragePath(key);

    try {
      await stat(filePath);
    } catch {
      throw new NotFoundException('Local attachment not found');
    }

    return {
      filePath,
      contentType: contentType?.trim() || null,
    };
  }

  private resolveLocalStoragePath(key: string): string {
    if (!isLocalStorageKey(key)) {
      throw new BadRequestException('Local storage endpoints require a local upload key');
    }

    return resolveLocalStoragePath(key, this.localStorageRoot);
  }
}
