/* eslint-disable no-console */
import EventEmitter from 'events';
import { createClient, RedisClientType, RedisDefaultModules, RedisModules, RedisScripts } from 'redis';
import { DateTime } from 'luxon';
import { getStreamKey, getTimeParamMillis, timeParamRE } from './utils/utils';
import { ILoggerEx } from './interfaces';

export interface IStartTimeRedisOptions {
  useStartTimeFromRedisCache: boolean,
  host: string,
  port: string | number,
  streamId: string,
  eventEmitter: EventEmitter,
  exitOnError: Function,
  logger: ILoggerEx,
}

export class StartTimeRedis {
  private readonly options: IStartTimeRedisOptions;

  private readonly client: RedisClientType<RedisDefaultModules & RedisModules, RedisScripts>;

  private readonly streamKey: string;

  constructor (options: IStartTimeRedisOptions) {
    this.options = options;
    const url = `redis://${options.host}:${options.port}`;
    console.log(`==================== Redis are expected at ${url} ========================`);
    this.client = createClient({ url });
    this.client.on('error', (err: Error | any) => {
      console.error('Redis Client Error');
      options.exitOnError(err);
    });
    const streamKey = getStreamKey(options.streamId);
    this.streamKey = streamKey;
    options.eventEmitter.on('save-last-ts', async (ts: number) => {
      const redisClient = await this.getRedisClient();
      redisClient?.set(streamKey, ts).catch((err: Error | any) => {
        options.logger.error(err);
      });
    });
  }

  async getRedisClient (): Promise<RedisClientType<RedisDefaultModules & RedisModules, RedisScripts>> {
    if (this.client.isOpen) {
      return this.client;
    }
    try {
      await this.client.connect();
    } catch (err: Error | any) {
      this.options.logger.error('Failed to initialize Redis client');
      this.options.exitOnError(err);
    }
    if (!this.client.isOpen) {
      this.options.exitOnError('Failed to initialize Redis client');
    }
    return this.client;
  }

  async getStartTimeFromRedis (): Promise<number> {
    const redisClient = await this.getRedisClient();
    let startTime;
    try {
      startTime = await redisClient.get(this.streamKey);
    } catch (err) {
      this.options.logger.error(err);
      return 0;
    }
    startTime = Number(startTime);
    if (!startTime) {
      return 0;
    }
    if (!DateTime.fromMillis(startTime).isValid) {
      this.options.logger.error(`Cache stored data is not a unix timestamp: ${startTime}`);
      return 0;
    }
    this.options.logger.info(`Get time of last sent entry: ${DateTime.fromMillis(startTime).toISO()} from the Redis cache using key ${this.streamKey}`);
    return startTime;
  }

  getStartTimeFromENV (): number {
    const { logger } = this.options;
    const { START_TIME = '', START_BEFORE = '' } = process.env;
    const dt = DateTime.fromISO(START_TIME);
    if (START_TIME) {
      if (dt.isValid) {
        return dt.toMillis();
      }
      logger.error(`Start time is incorrect. START_TIME: ${START_TIME}`);
    }
    if (START_BEFORE) {
      if (timeParamRE.test(START_BEFORE)) {
        return Date.now() - getTimeParamMillis(START_BEFORE);
      }
      logger.error(`Start time is incorrect. START_BEFORE: ${START_BEFORE}`);
    }
    return 0;
  }

  async getStartTime (): Promise<{ isUsedSavedStartTime: boolean, startTime: number }> {
    // инициализируем соединение с Redis для последующего сохранения состояния
    await this.getRedisClient();
    let startTime = 0;
    let isUsedSavedStartTime = false;
    if (this.options.useStartTimeFromRedisCache) {
      startTime = await this.getStartTimeFromRedis();
      isUsedSavedStartTime = !!startTime;
    }
    startTime = startTime || this.getStartTimeFromENV() || Date.now();
    return { isUsedSavedStartTime, startTime };
  }
}
