import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { run, Runner, makeWorkerUtils, WorkerUtils } from 'graphile-worker';

@Injectable()
export class GraphileWorkerService implements OnModuleInit, OnModuleDestroy {
  private runner: Runner | null = null;
  private utils: WorkerUtils | null = null;
  private utilsPromise: Promise<WorkerUtils> | null = null;

  constructor(private readonly config: ConfigService) {}

  async addJob(
    taskName: string,
    payload?: Record<string, unknown>,
    spec?: { queueName?: string; runAt?: Date; maxAttempts?: number },
  ): Promise<void> {
    const utils = await this.getUtils();
    await utils.addJob(taskName, payload ?? {}, spec);
  }

  async onModuleInit(): Promise<void> {
    const options = this.getOptions();
    const taskDir = path.join(__dirname, 'tasks');
    const crontabPath = path.join(__dirname, 'crontab');
    const hasCrontab = existsSync(crontabPath);

    this.runner = await run({
      ...options,
      taskDirectory: taskDir,
      ...(hasCrontab && { crontabFile: crontabPath }),
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
      this.utilsPromise = null;
    }
  }

  private async getUtils(): Promise<WorkerUtils> {
    if (this.utils) return this.utils;
    if (!this.utilsPromise) {
      this.utilsPromise = makeWorkerUtils(this.getOptions()).then((u) => {
        this.utils = u;
        return u;
      });
    }
    return this.utilsPromise;
  }

  private getOptions() {
    const host = this.config.get<string>("DB_HOST") ?? "localhost";
    const port = this.config.get<number>("DB_PORT") ?? 5432;
    const db = this.config.get<string>("DB_NAME") ?? "playnote";
    const user = this.config.get<string>("DB_USER") ?? "playnote";
    const password = this.config.get<string>("DB_PASSWORD") ?? "playnote";
    const connectionString = `postgres://${user}:${password}@${host}:${port}/${db}`;

    return {
      connectionString,
    };
  }
}
