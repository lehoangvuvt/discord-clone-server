import { Module } from '@nestjs/common'
import { MessageGateway } from './gateways/message.gateway'
import { UsersModule } from 'src/users/users.module'
import { JwtModule } from '@nestjs/jwt'

@Module({
  imports: [UsersModule, JwtModule.register({})],
  controllers: [],
  providers: [MessageGateway],
})
export class SocketModule {}
