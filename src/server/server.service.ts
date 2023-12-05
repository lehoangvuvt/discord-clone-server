import mongoose, { Model, ObjectId } from 'mongoose'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Server } from 'src/schemas/server.schema'
import CreateServerDTO from 'src/dtos/create-server.dto'
import { Channel } from 'src/schemas/channel.schema'
import { UserServer } from 'src/schemas/user-server.schema'
import { ServerInvitation } from 'src/schemas/server-invitation'
import { UserInvitation } from 'src/schemas/user-invitation'

@Injectable()
export class ServersService {
  constructor(
    @InjectModel(Server.name) private serverModel: Model<Server>,
    @InjectModel(Channel.name) private channelModel: Model<Channel>,
    @InjectModel(UserServer.name) private userServerModel: Model<UserServer>,
    @InjectModel(ServerInvitation.name) private serverInvitationModel: Model<ServerInvitation>,
    @InjectModel(UserInvitation.name) private userInvitationModel: Model<UserInvitation>
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
      await this.createServerInvitation(result._id + '')
      return result
    } catch (err) {
      console.log('Create server error: ' + err)
      return null
    }
  }

  async getServerInfo(serverId: string): Promise<Server> {
    const _serverId = new mongoose.Types.ObjectId(serverId)
    const result = await this.serverModel.aggregate([
      {
        $match: {
          _id: _serverId,
        },
      },
      {
        $lookup: {
          from: 'serverinvitations',
          as: 'invitation',
          localField: '_id',
          foreignField: 'serverId',
        },
      },
      {
        $unwind: '$invitation',
      },
      {
        $lookup: {
          from: 'channels',
          as: 'channels',
          localField: '_id',
          foreignField: 'serverId',
        },
      },
      {
        $limit: 1,
      },
    ])
    return result[0]
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

  async createServerInvitation(serverId: string): Promise<ServerInvitation> {
    const hourInMs = 1000 * 60 * 60
    const dayInMs = hourInMs * 24
    const expiredDate = new Date(Date.now() + dayInMs * 7)

    const serverInvitationModel = new this.serverInvitationModel({
      serverId: new mongoose.Types.ObjectId(serverId),
      expiredAt: expiredDate,
    })
    try {
      const result = await serverInvitationModel.save()
      return result
    } catch (err) {
      console.log('[createServerInvitation] error: ' + err)
      return null
    }
  }

  async useServerInvitation(
    invitation_short_id: string,
    userId: string
  ): Promise<
    | {
        status: 'Success'
      }
    | {
        status: 'Error'
        errorMsg: string
      }
  > {
    const _userId = new mongoose.Types.ObjectId(userId)
    const invitation = await this.serverInvitationModel.findOne({ invitation_short_id }).lean()
    if (Date.now() >= new Date(invitation.expiredAt).getTime()) {
      return {
        status: 'Error',
        errorMsg: 'This invation link is expired',
      }
    }
    if (invitation.limit > -1 && invitation.limit <= invitation.used_count) {
      return {
        status: 'Error',
        errorMsg: 'This invation is exceed limit',
      }
    } else {
      try {
        const existed = await this.userInvitationModel.findOne({ invitationId: invitation._id, userId: _userId }).lean()
        if (existed) {
          return {
            status: 'Error',
            errorMsg: 'User already used this invitation link',
          }
        }

        const updatedUsedCount = invitation.used_count + 1
        await this.serverInvitationModel.findOneAndUpdate({ _id: invitation._id }, { used_count: updatedUsedCount }, { upsert: true })

        const userInvitationModel = new this.userInvitationModel({
          invitationId: invitation._id,
          userId: _userId,
          invitation_short_id,
        })
        await userInvitationModel.save()

        const userServerModel = new this.userServerModel({
          serverId: invitation.serverId,
          userId: _userId,
        })
        await userServerModel.save()

        return {
          status: 'Success',
        }
      } catch (err) {
        console.log('[useServerInvitation] error: ' + err)
        return {
          status: 'Error',
          errorMsg: 'Something went wrong',
        }
      }
    }
  }
  async getServerInvitationDetails(invitation_short_id: string): Promise<ServerInvitation> {
    const result = await this.serverInvitationModel.aggregate([
      {
        $match: {
          invitation_short_id,
        },
      },
      {
        $lookup: {
          from: 'servers',
          localField: 'serverId',
          foreignField: '_id',
          as: 'serverDetails',
        },
      },
      {
        $unwind: '$serverDetails',
      },
    ])
    return result[0]
  }
}
