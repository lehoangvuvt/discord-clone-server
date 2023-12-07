import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { UsersService } from './users.service'
import { User, UserSchema } from '../schemas/user.schema'
import { UsersController } from './users.controller'
import { JwtModule } from '@nestjs/jwt'
import { UserServer, UserServerSchema } from 'src/schemas/user-server.schema'
import { MessageHistory, MessageHistorySchema } from 'src/schemas/message-history.schema'
import { Server, ServerSchema } from 'src/schemas/server.schema'
import { Attachment, AttachmentSchema } from 'src/schemas/attachment.schema'
import { MessageAttachment, MessageAttachmentSchema } from 'src/schemas/message-attachment'
import { UserRelationship, UserRelationshipSchema } from 'src/schemas/user-relationship'
import { Activity, ActivitySchema } from 'src/schemas/activity'
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserServer.name, schema: UserServerSchema },
      { name: MessageHistory.name, schema: MessageHistorySchema },
      { name: Server.name, schema: ServerSchema },
      { name: Attachment.name, schema: AttachmentSchema },
      { name: MessageAttachment.name, schema: MessageAttachmentSchema },
      { name: UserRelationship.name, schema: UserRelationshipSchema },
      { name: Activity.name, schema: ActivitySchema },
    ]),
    JwtModule.register({}),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
