import { Module, Global } from '@nestjs/common'
import AuthService from './auth.service'
import { JwtModule } from '@nestjs/jwt'
import { MongooseModule } from '@nestjs/mongoose'
import { User, UserSchema } from '../schemas/user.schema'
import { UserServer, UserServerSchema } from 'src/schemas/user-server.schema'
import { MessageHistory, MessageHistorySchema } from 'src/schemas/message-history.schema'
import { Server, ServerSchema } from 'src/schemas/server.schema'
import { Attachment, AttachmentSchema } from 'src/schemas/attachment.schema'
import { MessageAttachment, MessageAttachmentSchema } from 'src/schemas/message-attachment'
import { UsersService } from 'src/users/users.service'
import { UserRelationship, UserRelationshipSchema } from 'src/schemas/user-relationship'

@Global()
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
    ]),
    JwtModule.register({}),
  ],
  controllers: [],
  exports: [AuthService],
  providers: [AuthService, UsersService],
})
export class AuthModule {}
