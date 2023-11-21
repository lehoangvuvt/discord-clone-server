import mongoose, { Model, ObjectId } from 'mongoose'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Channel } from 'src/schemas/channel.schema'
import CreateChannelDTO from 'src/dtos/creacte-channel.dto'
import { MessageHistory } from 'src/schemas/message-history.schema'
import { MessageAttachment } from 'src/schemas/message-attachment'

@Injectable()
export class ChannelsService {
  constructor(
    @InjectModel(Channel.name) private channelModel: Model<Channel>,
    @InjectModel(MessageHistory.name) private messageHistoryModel: Model<MessageHistory>,
    @InjectModel(MessageAttachment.name) private messageAttachmentModel: Model<MessageAttachment>
  ) {}

  async createChannel(channelDTO: CreateChannelDTO): Promise<Channel> {
    const channelModel = new this.channelModel({
      name: channelDTO.name,
      serverId: channelDTO.serverId,
    })
    const response = await channelModel.save()
    return response
  }

  async getChannelMessageHistory(channelId: string): Promise<MessageHistory[]> {
    const id = new mongoose.Types.ObjectId(channelId)
    const result = await this.messageHistoryModel
      .aggregate([
        {
          $match: {
            channelId: id,
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userDetails',
            pipeline: [{ $project: { password: 0 } }],
          },
        },
        {
          $unwind: '$userDetails',
        },
        {
          $lookup: {
            from: 'messageattachments',
            localField: '_id',
            foreignField: 'messageId',
            as: 'attachments',
            pipeline: [
              {
                $lookup: {
                  from: 'attachments',
                  localField: 'attachmentId',
                  foreignField: '_id',
                  as: 'attachmentDetails',
                  pipeline: [
                    {
                      $lookup: {
                        from: 'uploadedfiles',
                        localField: 'fileId',
                        foreignField: '_id',
                        as: 'fileDetails',
                      },
                    },
                    {
                      $unwind: '$fileDetails',
                    },
                  ],
                },
              },
              {
                $unwind: '$attachmentDetails',
              },
            ],
          },
        },
        {
          $limit: 20,
        },
      ])
      .exec()
    return result.reverse()
  }
}
