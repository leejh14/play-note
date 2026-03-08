import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LocalStorageController } from './local-storage.controller';
import { S3StorageService } from './s3-storage.service';

@Module({
  imports: [ConfigModule],
  controllers: [LocalStorageController],
  providers: [S3StorageService],
  exports: [S3StorageService],
})
export class StorageModule {}
