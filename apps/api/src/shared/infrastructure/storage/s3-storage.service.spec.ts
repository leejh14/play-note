jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { S3StorageService } from './s3-storage.service';

const mockedGetSignedUrl = jest.mocked(getSignedUrl);

describe('S3StorageService', () => {
  let tempDir: string;

  beforeEach(async () => {
    jest.resetAllMocks();
    tempDir = await mkdtemp(path.join(tmpdir(), 'playnote-storage-spec-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('falls back to local upload URLs when AWS credentials are unavailable', async () => {
    mockedGetSignedUrl.mockRejectedValueOnce(
      Object.assign(new Error('Could not load credentials from any providers'), {
        name: 'CredentialsProviderError',
      }),
    );

    const service = createService(tempDir);
    const result = await service.createUploadTarget(
      'sessions/session-1/attachments/object-1',
      'image/png',
    );

    expect(result).toEqual({
      uploadId: 'local://sessions/session-1/attachments/object-1',
      presignedUrl:
        'http://localhost:4000/storage/upload?key=local%3A%2F%2Fsessions%2Fsession-1%2Fattachments%2Fobject-1',
    });
  });

  it('builds local object URLs for local storage keys', async () => {
    const service = createService(tempDir);

    await expect(
      service.getSignedUrl(
        'local://sessions/session-1/attachments/object-1',
        'image/png',
      ),
    ).resolves.toBe(
      'http://localhost:4000/storage/object?key=local%3A%2F%2Fsessions%2Fsession-1%2Fattachments%2Fobject-1&contentType=image%2Fpng',
    );
  });

  it('stores and retrieves local objects on disk', async () => {
    const service = createService(tempDir);
    const body = Buffer.from('png-bytes');

    await service.saveLocalObject(
      'local://sessions/session-1/attachments/object-1',
      toReadableStream(body),
    );

    const localObject = await service.getLocalObject(
      'local://sessions/session-1/attachments/object-1',
      'image/png',
    );

    await expect(readFile(localObject.filePath)).resolves.toEqual(body);
    expect(localObject.contentType).toBe('image/png');
  });

  it('deletes local objects when removing attachments', async () => {
    const service = createService(tempDir);
    const localFilePath = path.join(
      tempDir,
      'sessions/session-1/attachments/object-1',
    );

    await mkdir(path.dirname(localFilePath), { recursive: true });
    await writeFile(localFilePath, 'file');

    await service.deleteObjects([
      'local://sessions/session-1/attachments/object-1',
    ]);

    await expect(readFile(localFilePath)).rejects.toThrow();
  });
});

function createService(localStorageDir: string): S3StorageService {
  return new S3StorageService(
    new ConfigService({
      API_PORT: 4000,
      LOCAL_STORAGE_DIR: localStorageDir,
      S3_BUCKET: 'playnote-attachments',
      AWS_REGION: 'ap-northeast-2',
    }),
  );
}

function toReadableStream(buffer: Buffer): NodeJS.ReadableStream {
  return Readable.from(buffer);
}
