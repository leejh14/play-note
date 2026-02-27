import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphileWorkerService } from './graphile-worker.service';

@Module({
  imports: [ConfigModule],
  providers: [GraphileWorkerService],
  exports: [GraphileWorkerService],
})
export class GraphileWorkerModule {}
