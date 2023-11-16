import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ServersService } from './server.service'
import { Server, ServerSchema } from '../schemas/server.schema'
import { ServersController } from './server.controller'
import { JwtModule } from '@nestjs/jwt'
import { Channel, ChannelSchema } from 'src/schemas/channel.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Server.name, schema: ServerSchema },
      { name: Channel.name, schema: ChannelSchema },
    ]),
    JwtModule.register({}),
  ],
  controllers: [ServersController],
  providers: [ServersService],
  exports: [ServersService],
})
export class ServersModule {}
