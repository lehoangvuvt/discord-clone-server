import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ServersService } from './server.service'
import { Server, ServerSchema } from '../schemas/server.schema'
import { ServersController } from './server.controller'
import { JwtModule } from '@nestjs/jwt'
import { Channel, ChannelSchema } from 'src/schemas/channel.schema'
import { ChannelsService } from 'src/channels/channels.service'
import { MessageHistory, MessageHistorySchema } from 'src/schemas/message-history.schema'
import { MessageAttachment, MessageAttachmentSchema } from 'src/schemas/message-attachment'
import { UserServer, UserServerSchema } from 'src/schemas/user-server.schema'
import { AuthModule } from 'src/auth/auth.module'
import { ServerInvitation, ServerInvitationSchema } from 'src/schemas/server-invitation'
import { UserInvitation, UserInvitationSchema } from 'src/schemas/user-invitation'
import { RedisService } from 'src/redis/redis.service'
import RabbitMQService from 'src/rabbitmq/rabbitmq.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Server.name, schema: ServerSchema },
      { name: Channel.name, schema: ChannelSchema },
      { name: MessageHistory.name, schema: MessageHistorySchema },
      { name: MessageAttachment.name, schema: MessageAttachmentSchema },
      { name: UserServer.name, schema: UserServerSchema },
      { name: ServerInvitation.name, schema: ServerInvitationSchema },
      { name: UserInvitation.name, schema: UserInvitationSchema },
    ]),
    JwtModule.register({}),
    AuthModule,
  ],
  controllers: [ServersController],
  providers: [ServersService, ChannelsService, RedisService, RabbitMQService],
  exports: [ServersService],
})
export class ServersModule {}
