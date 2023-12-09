import { Global, Injectable } from '@nestjs/common'
import { RedisClientType, createClient } from 'redis'
import { Redis } from 'ioredis'

@Global()
@Injectable()
export class RedisService {
  private redisClient: Redis
  constructor() {
    this.redisClient = new Redis(process.env.REDIS_PRIVATE_URL ?? process.env.REDIS_LOCAL_URL)
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
        console.error('Failed to subscribe: %s', err.message)
      }
    })
  }

  public on(onReceiveMessage: (channel: string, data: string) => void) {
    this.redisClient.on('message', (channel, data) => {
      onReceiveMessage(channel, data)
    })
  }
}
