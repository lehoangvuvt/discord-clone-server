import { Module } from '@nestjs/common'
import { MessageGateway } from './gateways/message.gateway'
import { UsersModule } from 'src/users/users.module'
import { JwtModule } from '@nestjs/jwt'
import { RedisService } from 'src/redis/redis.service'

@Module({
  imports: [UsersModule, JwtModule.register({})],
  controllers: [],
  providers: [MessageGateway, RedisService],
})
export class SocketModule {}
