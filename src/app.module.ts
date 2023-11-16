import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { MongooseModule } from '@nestjs/mongoose'
import { UsersModule } from './users/users.module'
import { SocketModule } from './socket/socket.module'
import { ChannelsModule } from './channels/channels.module'
import { ServersModule } from './server/server.module'

@Module({
  imports: [
    MongooseModule.forRoot('mongodb+srv://cluster0.679kcfi.mongodb.net', {
      user: 'hoangvule100',
      pass: 'pc1264183vT.',
      dbName: 'discord-clone',
    }),
    UsersModule,
    ChannelsModule,
    ServersModule,
    SocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
