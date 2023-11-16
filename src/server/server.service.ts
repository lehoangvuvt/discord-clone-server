import { Model, ObjectId } from 'mongoose'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Server } from 'src/schemas/server.schema'
import CreateServerDTO from 'src/dtos/create-server.dto'
import { Channel } from 'src/schemas/channel.schema'

@Injectable()
export class ServersService {
  constructor(@InjectModel(Server.name) private serverModel: Model<Server>, @InjectModel(Channel.name) private channelModel: Model<Channel>) {}

  async createServer(serverDTO: CreateServerDTO): Promise<Server> {
    const serverModel = new this.serverModel({
      creator: serverDTO.creator,
      name: serverDTO.name,
    })
    const result = await serverModel.save()
    return result
  }

  async getServerChannels(serverId: ObjectId): Promise<Channel[]> {
    const result = await this.channelModel.find({ serverId }).lean()
    return result
  }

  async createChannel() {}
}
