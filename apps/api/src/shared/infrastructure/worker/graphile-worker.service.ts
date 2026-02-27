import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { run, makeWorkerUtils } from 'graphile-worker';
import path from 'node:path';

@Injectable()
export class GraphileWorkerService {
  private runner: Awaited<ReturnType<typeof run>> | null = null;
  private utils: Awaited<ReturnType<typeof makeWorkerUtils>> | null = null;

  constructor(private readonly config: ConfigService) {}

  async addJob(
    taskName: string,
    payload?: Record<string, unknown>,
    spec?: { queueName?: string; runAt?: Date; maxAttempts?: number },
  ): Promise<void> {
    if (!this.utils) {
      this.utils = await makeWorkerUtils(this.getOptions());
    }
    await this.utils.addJob(taskName, payload ?? {}, spec);
  }

  async onModuleInit(): Promise<void> {
    const options = this.getOptions();
    const taskDir = path.join(__dirname, 'tasks');
    const crontabPath = path.join(__dirname, 'crontab');

    this.runner = await run({
      ...options,
      taskDirectory: taskDir,
      crontabFile: crontabPath,
      concurrency: this.config.get<number>('WORKER_CONCURRENCY') ?? 1,
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.runner) {
      await this.runner.stop();
      this.runner = null;
    }
    if (this.utils) {
      await this.utils.release();
      this.utils = null;
    }
  }

  private getOptions() {
    const host = this.config.get<string>('DB_HOST') ?? 'localhost';
    const port = this.config.get<number>('DB_PORT') ?? 5432;
    const db = this.config.get<string>('DB_NAME') ?? 'playnote';
    const user = this.config.get<string>('DB_USER') ?? 'playnote';
    const password = this.config.get<string>('DB_PASSWORD') ?? 'playnote';
    const connectionString = `postgres://${user}:${password}@${host}:${port}/${db}`;

    return {
      connectionString,
    };
  }
}
