import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ChannelsService } from './channels.service'
import { Channel, ChannelSchema } from '../schemas/channel.schema'
import { ChannelsController } from './channels.controller'
import { JwtModule } from '@nestjs/jwt'
import { MessageHistory, MessageHistorySchema } from 'src/schemas/message-history.schema'
import { MessageAttachment, MessageAttachmentSchema } from 'src/schemas/message-attachment'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Channel.name, schema: ChannelSchema },
      { name: MessageHistory.name, schema: MessageHistorySchema },
      { name: MessageAttachment.name, schema: MessageAttachmentSchema },
    ]),
    JwtModule.register({}),
  ],
  controllers: [ChannelsController],
  providers: [ChannelsService],
  exports: [ChannelsService],
})
export class ChannelsModule {}
