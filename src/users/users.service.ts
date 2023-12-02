import mongoose, { Model, ObjectId } from 'mongoose'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { User } from '../schemas/user.schema'
import { compareSync, hashSync } from 'bcrypt'
import CreateUserDTO from '../dtos/create-user.dto'
import { UserServer } from 'src/schemas/user-server.schema'
import { MessageHistory } from 'src/schemas/message-history.schema'
import { Server } from 'src/schemas/server.schema'
import CreateAttachmentDTO from 'src/dtos/create-attachment.dto'
import { Attachment } from 'src/schemas/attachment.schema'
import { MessageAttachment } from 'src/schemas/message-attachment'
import UploadFileDTO from 'src/dtos/upload-file.dto'
import { writeFile } from 'mz/fs'
import { RelationshipTypeEnum, UserRelationship } from 'src/schemas/user-relationship'

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserServer.name) private userServerModel: Model<UserServer>,
    @InjectModel(Server.name) private serverModel: Model<Server>,
    @InjectModel(MessageHistory.name) private messageHistoryModel: Model<MessageHistory>,
    @InjectModel(Attachment.name) private attachmentModel: Model<Attachment>,
    @InjectModel(MessageAttachment.name) private messageAttachmentModel: Model<MessageAttachment>,
    @InjectModel(UserRelationship.name) private userRelationshipModel: Model<UserRelationship>
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

  async getUserByIdAuthentication(userId: string): Promise<User> {
    const foundUser: any[] = await this.userModel
      .aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(userId),
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
      delete formattedUserData.password
      return formattedUserData
    } else {
      return null
    }
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

  async findUsers(keyword: string): Promise<User[]> {
    if (keyword.trim().length == 0) return []
    const result = await this.userModel.aggregate([
      {
        $match: {
          $or: [
            {
              username: {
                $regex: keyword,
                $options: 'i',
              },
            },
            {
              name: {
                $regex: keyword,
                $options: 'i',
              },
            },
          ],
        },
      },
      {
        $project: {
          password: 0,
        },
      },
    ])
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

  async sendMessage(data: { message: string; channelId: ObjectId; userId: ObjectId; fileIds: string[] }): Promise<MessageHistory> {
    const { channelId, message, userId, fileIds } = data
    const messageHistoryModel = new this.messageHistoryModel({ channelId, message, userId })
    const response = await messageHistoryModel.save()
    if (fileIds && fileIds.length > 0) {
      const createAttachments = fileIds.map(async (fileId) => {
        const attachmentModel = new this.attachmentModel({
          fileId: new mongoose.Types.ObjectId(fileId),
        })
        const result = await attachmentModel.save()
        if (result) {
          const messageAttachmentModel = new this.messageAttachmentModel({
            attachmentId: result._id,
            messageId: response._id,
          })
          await messageAttachmentModel.save()
        }
      })

      await Promise.all(createAttachments)
    }
    return response
  }

  async uploadFile(uploadFileDTO: UploadFileDTO) {
    const { name, type, base64 } = uploadFileDTO
    const base64Data = base64.replace(type, '')
    const path = 'uploaded-files'
    let subPath = ''
    if (type.includes('image')) {
      subPath = 'images'
    } else if (type.includes('audio')) {
      subPath = 'audio'
    } else if (type.includes('video')) {
      subPath = 'videos'
    } else {
      subPath = 'others'
    }
    try {
      await writeFile(`${path}/${subPath}/${name}`, base64Data, 'base64')
      console.log(`${path}/${subPath}/${name}`)
      const attachmentModel = new this.attachmentModel({
        name,
        type,
        path: `${subPath}/${name}`,
      })
      const result = await attachmentModel.save()
      return result
    } catch (error) {
      console.log('Error at upload file: ' + error)
      return null
    }
  }

  async updateUserInfo(updatedUserInfo: User, userId: string): Promise<User> {
    const _id = new mongoose.Types.ObjectId(userId)
    const query = { _id }
    try {
      const result = await this.userModel.findOneAndUpdate(query, updatedUserInfo, { upsert: true }).lean()
      const latestUserInfo = await this.getUserByIdAuthentication(userId)
      return latestUserInfo
    } catch (e) {
      console.log('[Error at updateUserInfo]: ' + e)
      return null
    }
  }

  async getUserFriendList(userId: string): Promise<User[]> {
    const _id = new mongoose.Types.ObjectId(userId)
    const matchedRecords = await this.userRelationshipModel
      .find({ $or: [{ userFirstId: _id }, { userSecondId: _id }], $and: [{ type: RelationshipTypeEnum.FRIEND }] })
      .lean()
    let friends: User[] = []
    if (matchedRecords.length > 0) {
      const friendIds = []
      matchedRecords.forEach((record) => {
        if (JSON.stringify(record.userFirstId).replace('"', '').replace('"', '') !== userId) {
          friendIds.push(record.userFirstId)
        }
        if (JSON.stringify(record.userSecondId).replace('"', '').replace('"', '') !== userId) {
          friendIds.push(record.userSecondId)
        }
      })
      friends = await this.userModel.find({ _id: { $in: friendIds } }).select({ password: 0 })
    }
    return friends
  }

  async getUserPendingRequests(userId: string): Promise<{
    receiveFromUsers: { user: User; request: UserRelationship }[]
    sentToUsers: { user: User; request: UserRelationship }[]
  }> {
    let result: { receiveFromUsers: { user: User; request: UserRelationship }[]; sentToUsers: { user: User; request: UserRelationship }[] } = {
      receiveFromUsers: [],
      sentToUsers: [],
    }
    const _id = new mongoose.Types.ObjectId(userId)
    const matchedRecords = await this.userRelationshipModel
      .find({
        $or: [{ userFirstId: _id }, { userSecondId: _id }],
        $and: [
          {
            $or: [
              { type: RelationshipTypeEnum.PENDING_REQUEST },
              {
                type: RelationshipTypeEnum.DECLINE,
              },
            ],
          },
        ],
      })
      .lean()
    if (matchedRecords.length > 0) {
      const receiveFromUsers: { user: User; request: UserRelationship }[] = []
      const sentToUsers: { user: User; request: UserRelationship }[] = []
      const getDatas = matchedRecords.map(async (record) => {
        if (JSON.stringify(record.userFirstId).replace('"', '').replace('"', '') !== userId) {
          const user = await this.userModel
            .findOne({ _id: { $in: record.userFirstId } })
            .select({ password: 0 })
            .lean()
          receiveFromUsers.push({ user, request: record })
        }
        if (JSON.stringify(record.userSecondId).replace('"', '').replace('"', '') !== userId) {
          const user = await this.userModel
            .findOne({ _id: { $in: record.userSecondId } })
            .select({ password: 0 })
            .lean()
          sentToUsers.push({ user, request: record })
        }
      })
      await Promise.all(getDatas)
      result.receiveFromUsers = receiveFromUsers
      result.sentToUsers = sentToUsers
    }
    return result
  }

  async sendFriendRequest(
    userId: string,
    targetUsername: string
  ): Promise<
    | {
        status: 'Success'
        targetUser: User
        result: UserRelationship
      }
    | {
        status: 'Error'
        reason: 'NOT_FOUND' | 'FAILED' | 'RECEIVED_FROM_TARGET' | 'ALREADY_FRIEND' | 'BLOCKED_FROM_TARGET' | 'YOURSELF' | 'ALREADY_SENT'
      }
  > {
    const _id = new mongoose.Types.ObjectId(userId)
    const user = await this.userModel.findById({ _id })
    const foundUser = await this.userModel.findOne({ username: targetUsername }).select({ password: 0 })
    if (!foundUser) return { status: 'Error', reason: 'NOT_FOUND' }
    if (user.username === foundUser.username) return { status: 'Error', reason: 'YOURSELF' }
    const foundUserRelationship = await this.userRelationshipModel.findOne({ userFirstId: foundUser._id, userSecondId: _id })
    if (!foundUserRelationship) {
      const userRelationshipModel = new this.userRelationshipModel({
        type: RelationshipTypeEnum.PENDING_REQUEST,
        userFirstId: new mongoose.Types.ObjectId(userId),
        userSecondId: foundUser._id,
      })
      try {
        const result = await userRelationshipModel.save()
        return {
          status: 'Success',
          result,
          targetUser: foundUser,
        }
      } catch (err) {
        console.log('sendFriendRequest error: ' + err)
        if (err + ''.includes('duplicate')) return { status: 'Error', reason: 'ALREADY_SENT' }
        return { status: 'Error', reason: 'FAILED' }
      }
    } else {
      const type = foundUserRelationship.type
      const result: {
        status: 'Error'
        reason: 'NOT_FOUND' | 'FAILED' | 'RECEIVED_FROM_TARGET' | 'ALREADY_FRIEND' | 'BLOCKED_FROM_TARGET' | 'YOURSELF'
      } = { status: 'Error', reason: 'FAILED' }
      switch (type) {
        case RelationshipTypeEnum.PENDING_REQUEST:
          result.reason = 'RECEIVED_FROM_TARGET'
          break
        case RelationshipTypeEnum.FRIEND:
          result.reason = 'ALREADY_FRIEND'
          break
        case RelationshipTypeEnum.BLOCK_FIRST_SECOND:
          result.reason = 'BLOCKED_FROM_TARGET'
          break
      }
      return result
    }
  }

  async handleFriendRequest(userId: string, requestId: string, relationshipType: RelationshipTypeEnum): Promise<UserRelationship> {
    try {
      const result = await this.userRelationshipModel
        .findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(requestId), userSecondId: new mongoose.Types.ObjectId(userId) },
          {
            type: relationshipType,
          },
          { upsert: true }
        )
        .exec()
      const updatedRelationship = await this.userRelationshipModel.findOne({
        _id: new mongoose.Types.ObjectId(requestId),
        userSecondId: new mongoose.Types.ObjectId(userId),
      })
      return updatedRelationship
    } catch (err) {
      console.log('acceptFriendRequest error: ' + err)
      return null
    }
  }
}
