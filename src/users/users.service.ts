import { Model, ObjectId } from 'mongoose'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { User } from '../schemas/user.schema'
import { compareSync, hashSync } from 'bcrypt'
import CreateUserDTO from '../dtos/create-user.dto'
import { UserServer } from 'src/schemas/user-server.schema'
import { MessageHistory } from 'src/schemas/message-history.schema'
import { Server } from 'src/schemas/server.schema'

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserServer.name) private userServerModel: Model<UserServer>,
    @InjectModel(Server.name) private serverModel: Model<Server>,
    @InjectModel(MessageHistory.name) private messageHistoryModel: Model<MessageHistory>
  ) {}

  async create(userDTO: CreateUserDTO): Promise<User> {
    const result = await this.userModel.findOne({ username: userDTO.username }).exec()
    if (!result) {
      const hashedPassword = hashSync(userDTO.password, 10)
      const userModel = new this.userModel({
        password: hashedPassword,
        username: userDTO.username,
        name: userDTO.name,
      })
      const response = await userModel.save()
      this.setServersToUser(response._id)
      return response
    } else {
      return null
    }
  }

  async setServersToUser(userId: ObjectId) {
    const allServers: Server[] = await this.serverModel.find().lean()
    allServers.forEach(async (server) => {
      const serverId = server._id
      await this.joinServer(userId, serverId)
    })
  }

  async login(userDTO: CreateUserDTO): Promise<any> {
    const foundUser: any[] = await this.userModel
      .aggregate([
        {
          $match: {
            username: userDTO.username,
          },
        },
        {
          $lookup: {
            from: 'servers',
            localField: '_id',
            foreignField: 'creator',
            as: 'createdServers',
          },
        },
        {
          $lookup: {
            from: 'userservers',
            localField: '_id',
            foreignField: 'userId',
            as: 'joinedServers',
            pipeline: [
              {
                $lookup: {
                  from: 'servers',
                  localField: 'serverId',
                  foreignField: '_id',
                  as: 'details',
                },
              },
            ],
          },
        },
        {
          $limit: 1,
        },
      ])
      .exec()
    if (foundUser?.length > 0) {
      let formattedUserData = { ...foundUser[0] }
      formattedUserData.joinedServers = formattedUserData.joinedServers.map((ele) => {
        return {
          _id: ele._id,
          createdAt: ele.createdAt,
          updatedAt: ele.updatedAt,
          ...ele.details[0],
        }
      })

      const isPasswordValid = compareSync(userDTO.password, foundUser[0].password)
      if (isPasswordValid) {
        delete formattedUserData.password
        return formattedUserData
      } else {
        return null
      }
    } else {
      return null
    }
  }

  async findUserByUsername(username: string): Promise<any> {
    const result = await this.userModel
      .aggregate([
        {
          $lookup: {
            from: 'servers',
            localField: '_id',
            foreignField: 'creator',
            as: 'createdServers',
          },
        },
        {
          $lookup: {
            from: 'userservers',
            localField: '_id',
            foreignField: 'userId',
            as: 'joinedServers',
          },
        },
      ])
      .exec()
    return result
  }

  async getUserById(userId: ObjectId): Promise<User> {
    const result = await this.userModel.findOne({ _id: userId }).lean()
    return result
  }

  async joinServer(userId: ObjectId, serverId: ObjectId): Promise<UserServer> {
    const userServerModel = new this.userServerModel({
      serverId,
      userId,
    })
    const response = await userServerModel.save()
    return response
  }

  async sendMessage(data: { message: string; channelId: ObjectId; userId: ObjectId }): Promise<MessageHistory> {
    const { channelId, message, userId } = data
    const messageHistoryModel = new this.messageHistoryModel({ channelId, message, userId })
    const response = await messageHistoryModel.save()
    return response
  }

  async getUsersByIds(userIds: ObjectId[]): Promise<User[]> {
    const result = await this.userModel
      .find({
        _id: {
          $in: userIds,
        },
      })
      .lean()
    return result
  }
}
