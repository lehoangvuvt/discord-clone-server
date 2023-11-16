import { Model, ObjectId } from 'mongoose'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Channel } from 'src/schemas/channel.schema'
import CreateChannelDTO from 'src/dtos/creacte-channel.dto'
import { MessageHistory } from 'src/schemas/message-history.schema'

@Injectable()
export class ChannelsService {
  constructor(
    @InjectModel(Channel.name) private channelModel: Model<Channel>,
    @InjectModel(MessageHistory.name) private messageHistoryModel: Model<MessageHistory>
  ) {}

  async createChannel(channelDTO: CreateChannelDTO): Promise<Channel> {
    const channelModel = new this.channelModel({
      name: channelDTO.name,
      serverId: channelDTO.serverId,
    })
    const response = await channelModel.save()
    return response
  }

  async getChannelMessageHistory(channelId: ObjectId): Promise<MessageHistory[]> {
    const result = await this.messageHistoryModel.find({ channelId }).sort('-createdAt').limit(20).populate('userDetails').lean()
    result.forEach((ele) => delete ele['userDetails']['password'])
    return result.reverse()
  }
}
