import mongoose, { Model, ObjectId } from 'mongoose'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Server } from 'src/schemas/server.schema'
import CreateServerDTO from 'src/dtos/create-server.dto'
import { Channel } from 'src/schemas/channel.schema'
import { UserServer } from 'src/schemas/user-server.schema'

@Injectable()
export class ServersService {
  constructor(
    @InjectModel(Server.name) private serverModel: Model<Server>,
    @InjectModel(Channel.name) private channelModel: Model<Channel>,
    @InjectModel(UserServer.name) private userServerModel: Model<UserServer>
  ) {}

  async createServer(serverDTO: CreateServerDTO, userId: string): Promise<Server> {
    const serverModel = new this.serverModel({
      creator: new mongoose.Types.ObjectId(userId),
      name: serverDTO.name,
      avatar: serverDTO.avatar,
    })
    try {
      const result = await serverModel.save()
      try {
        const userServerModel = new this.userServerModel({
          serverId: result._id,
          userId: new mongoose.Types.ObjectId(userId),
        })
        await userServerModel.save()
      } catch (err) {
        console.log('Join server error: ' + err)
      }
      return result
    } catch (err) {
      console.log('Create server error: ' + err)
      return null
    }
  }

  async getServerChannels(serverId: ObjectId): Promise<Channel[]> {
    const result = await this.channelModel.find({ serverId }).lean()
    return result
  }

  async leaveServer(serverId: string, userId: ObjectId): Promise<UserServer> {
    try {
      const result = await this.userServerModel.findOneAndRemove({ serverId: new mongoose.Types.ObjectId(serverId), userId }).exec()
      return result
    } catch (error) {
      console.log('leaveServer error: ' + error)
      return null
    }
  }
}
