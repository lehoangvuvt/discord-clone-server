import { Module } from '@nestjs/common'
import MailService from './mail.service'
import { MailController } from './mail.controller'
import RabbitMQService from 'src/rabbitmq/rabbitmq.service'
import { RedisService } from 'src/redis/redis.service'

@Module({
  imports: [],
  controllers: [MailController],
  providers: [MailService, RabbitMQService, RedisService],
  exports: [MailService],
})
export class MailModule {}
