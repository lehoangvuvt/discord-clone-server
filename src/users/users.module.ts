import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { UsersService } from './users.service'
import { User, UserSchema } from '../schemas/user.schema'
import { UsersController } from './users.controller'
import { JwtModule } from '@nestjs/jwt'
import { UserServer, UserServerSchema } from 'src/schemas/user-server.schema'
import { MessageHistory, MessageHistorySchema } from 'src/schemas/message-history.schema'
import { Server, ServerSchema } from 'src/schemas/server.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserServer.name, schema: UserServerSchema },
      { name: MessageHistory.name, schema: MessageHistorySchema },
      { name: Server.name, schema: ServerSchema },
    ]),
    JwtModule.register({}),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
