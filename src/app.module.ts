import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { MongooseModule } from '@nestjs/mongoose'
import { UsersModule } from './users/users.module'
import { SocketModule } from './socket/socket.module'
import { ChannelsModule } from './channels/channels.module'
import { ServersModule } from './server/server.module'
import { ConfigModule } from '@nestjs/config'
import { AttachmentModule } from './attachment/attachment.module'

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.DATABASE_CONNECTION_STRING, {
      user: process.env.DATABASE_USER,
      pass: process.env.DATABASE_PASSWORD,
      dbName: process.env.DATABASE_NAME,
    }),
    UsersModule,
    ChannelsModule,
    ServersModule,
    SocketModule,
    AttachmentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
