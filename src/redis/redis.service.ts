import { Global, Injectable } from '@nestjs/common'
import { Redis } from 'ioredis'

@Global()
@Injectable()
export class RedisService {
  private redisClient: Redis
  constructor() {
    this.redisClient = new Redis(process.env.REDIS_URL)
  }

  public getRedisClient(): Redis {
    return this.redisClient
  }

  public publish(channelName: string, data: string) {
    this.redisClient.publish(channelName, data)
  }

  public subscribe(channelNames: string[]) {
    this.redisClient.subscribe(...channelNames, (err, count) => {
      if (err) {
        console.error('Failed to subscribe: ', err.message)
      } else {
        console.log('Subsribe to ' + count)
      }
    })
  }

  public on(onReceiveMessage: (channel: string, data: string) => void) {
    this.redisClient.on('message', (channel, data) => {
      onReceiveMessage(channel, data)
    })
  }

  public set(key: string, data: any) {
    this.redisClient.set(key, JSON.stringify(data))
  }

  public async get<T>(key: string): Promise<T> {
    const result = await this.redisClient.get(key)
    if (!result) return null
    return JSON.parse(result)
  }

  public hset(key: string, field: string, value: string) {
    this.redisClient.hset(key, { [field]: value })
  }

  public async hget<T>(key: string, field: string): Promise<T> {
    const result = await this.redisClient.hget(key, field)
    if (!result) return null
    return JSON.parse(result)
  }

  public hdel(key: string, field: string) {
    this.redisClient.hdel(key, field)
  }
}
