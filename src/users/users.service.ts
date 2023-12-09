import mongoose, { Model, ObjectId } from 'mongoose'
import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { User } from '../schemas/user.schema'
import { compareSync, hashSync } from 'bcrypt'
import CreateUserDTO from '../dtos/create-user.dto'
import { UserServer } from 'src/schemas/user-server.schema'
import { MessageHistory } from 'src/schemas/message-history.schema'
import { Server } from 'src/schemas/server.schema'
import { Attachment } from 'src/schemas/attachment.schema'
import { MessageAttachment } from 'src/schemas/message-attachment'
import UploadFileDTO from 'src/dtos/upload-file.dto'
import { writeFile } from 'mz/fs'
import { RelationshipTypeEnum, UserRelationship } from 'src/schemas/user-relationship'
import { SendFriendRequestErrorReasonEnum } from 'src/types/enum.types'
import { Activity, ActivityVerbEnum } from 'src/schemas/activity'
import { RedisClientType, createClient } from 'redis'

@Injectable()
export class UsersService {
  private publisher: RedisClientType
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserServer.name) private userServerModel: Model<UserServer>,
    @InjectModel(Server.name) private serverModel: Model<Server>,
    @InjectModel(MessageHistory.name) private messageHistoryModel: Model<MessageHistory>,
    @InjectModel(Attachment.name) private attachmentModel: Model<Attachment>,
    @InjectModel(MessageAttachment.name) private messageAttachmentModel: Model<MessageAttachment>,
    @InjectModel(UserRelationship.name) private userRelationshipModel: Model<UserRelationship>,
    @InjectModel(Activity.name) private activityModel: Model<Activity>
  ) {
    this.publisher = createClient({
      url: process.env.REDIS_PRIVATE_URL ?? process.env.REDIS_LOCAL_URL
    })
    this.publisher.connect()
  }

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

  async getUserInfo(query: { [key: string]: any }): Promise<User> {
    const foundUser: any[] = await this.userModel
      .aggregate([
        {
          $match: query,
        },
        {
          $lookup: {
            from: 'servers',
            localField: '_id',
            foreignField: 'creator',
            as: 'createdServers',
            pipeline: [
              // {
              //   $lookup: {
              //     from: 'serverinvitations',
              //     as: 'invitations',
              //     localField: '_id',
              //     foreignField: 'serverId',
              //   },
              // },
              {
                $lookup: {
                  from: 'channels',
                  as: 'channels',
                  localField: '_id',
                  foreignField: 'serverId',
                },
              },
            ],
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
                  pipeline: [
                    // {
                    //   $lookup: {
                    //     from: 'serverinvitations',
                    //     as: 'invitations',
                    //     localField: '_id',
                    //     foreignField: 'serverId',
                    //   },
                    // },
                    {
                      $lookup: {
                        from: 'channels',
                        as: 'channels',
                        localField: '_id',
                        foreignField: 'serverId',
                      },
                    },
                  ],
                },
              },
              {
                $unwind: '$details',
              },
            ],
          },
        },
        {
          $limit: 1,
        },
      ])
      .exec()
    console.log(query)
    if (foundUser?.length > 0) {
      let formattedUserData = { ...foundUser[0] }
      formattedUserData.createdServers = formattedUserData.createdServers.map((ele: any) => {
        return {
          ...ele,
        }
      })

      formattedUserData.joinedServers = formattedUserData.joinedServers.map((ele: any) => {
        return {
          _id: ele._id,
          createdAt: ele.createdAt,
          updatedAt: ele.updatedAt,
          ...ele.details,
        }
      })
      delete formattedUserData.password
      return formattedUserData
    } else {
      return null
    }
  }

  async login(userDTO: CreateUserDTO): Promise<any> {
    const userModel = await this.userModel.findOne({ username: userDTO.username }).lean()
    const isPasswordValid = compareSync(userDTO.password, userModel.password)
    if (isPasswordValid) {
      const formattedUserData = await this.getUserInfo({ username: userDTO.username })
      if (formattedUserData) {
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

  async getUserById(userId: string): Promise<User> {
    const result = await this.userModel.findOne({ _id: new mongoose.Types.ObjectId(userId) }).lean()
    return result
  }

  async getUserByIdAuthentication(userId: string): Promise<User> {
    const formattedUserData = await this.getUserInfo({ _id: new mongoose.Types.ObjectId(userId) })
    if (formattedUserData) {
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

  async sendMessage(data: { message: string; channelId: string; userId: string; fileIds: string[] }): Promise<MessageHistory> {
    const { channelId, message, userId, fileIds } = data
    try {
      const messageHistoryModel = new this.messageHistoryModel({
        channelId: new mongoose.Types.ObjectId(channelId),
        message,
        userId: new mongoose.Types.ObjectId(userId),
      })
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
      this.publisher.publish(`message-to-channel`, channelId)
      return response
    } catch (err) {
      return null
    }
  }

  async sendP2PMessage(data: { message: string; receiverId: string; userId: string; fileIds: string[] }): Promise<MessageHistory> {
    const { userId, receiverId, message, fileIds } = data
    const messageHistoryModel = new this.messageHistoryModel({
      receiverId: new mongoose.Types.ObjectId(receiverId),
      message,
      userId: new mongoose.Types.ObjectId(userId),
    })
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
        reason: SendFriendRequestErrorReasonEnum
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
        this.createActivity(userId, foundUser._id.toString(), ActivityVerbEnum.ADD_FRIEND)
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
        reason: SendFriendRequestErrorReasonEnum
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
      if (relationshipType === RelationshipTypeEnum.FRIEND) {
        await this.userRelationshipModel
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
        this.removeActivity(updatedRelationship.userFirstId.toString(), updatedRelationship.userSecondId.toString())
        return updatedRelationship
      } else {
        const result = await this.userRelationshipModel.findOneAndRemove({ _id: new mongoose.Types.ObjectId(requestId) }).exec()
        this.removeActivity(result.userFirstId.toString(), result.userSecondId.toString())
        return result
      }
    } catch (err) {
      console.log('acceptFriendRequest error: ' + err)
      return null
    }
  }

  async getP2PMessageHistory(
    userId: string,
    targetUserId: string,
    page: number,
    limit: number
  ): Promise<{
    totalPage: number
    currentPage: number
    data: MessageHistory[]
    hasMore: boolean
  }> {
    const _userId = new mongoose.Types.ObjectId(userId)
    const _targetUserId = new mongoose.Types.ObjectId(targetUserId)
    const skip = limit * (page - 1)
    const amount = await this.messageHistoryModel.count({
      $or: [
        { userId: _userId, receiverId: _targetUserId },
        { userId: _targetUserId, receiverId: _userId },
      ],
    })

    const totalPage = Math.floor(amount / limit)

    const result = await this.messageHistoryModel
      .aggregate([
        {
          $match: {
            $or: [
              {
                userId: _userId,
                receiverId: _targetUserId,
              },
              {
                userId: _targetUserId,
                receiverId: _userId,
              },
            ],
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
        { $limit: skip + limit },
        { $skip: skip },
      ])
      .exec()
    return {
      totalPage,
      currentPage: page,
      hasMore: page < totalPage,
      data: result.reverse(),
    }
  }

  async getP2PNewMessagesSinceDT(
    userId: string,
    targetUserId: string,
    datetime: string
  ): Promise<{
    total: number
    data: MessageHistory[]
  }> {
    const _userId = new mongoose.Types.ObjectId(userId)
    const _targetUserId = new mongoose.Types.ObjectId(targetUserId)
    const formattedDT = new Date(datetime)

    const result = await this.messageHistoryModel
      .aggregate([
        {
          $match: {
            $and: [
              {
                $or: [
                  {
                    userId: _userId,
                    receiverId: _targetUserId,
                  },
                  {
                    userId: _targetUserId,
                    receiverId: _userId,
                  },
                ],
              },
              {
                createdAt: { $gt: formattedDT },
              },
            ],
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
      ])
      .exec()
    return {
      total: result.length,
      data: result.reverse(),
    }
  }

  async createActivity(actor_id: string, object_id: string, verb: ActivityVerbEnum): Promise<Activity> {
    try {
      const activityModel = new this.activityModel({
        actor_id: new mongoose.Types.ObjectId(actor_id),
        object_id: new mongoose.Types.ObjectId(object_id),
        verb,
      })
      const result = await activityModel.save()
      return result
    } catch (err) {
      console.log('[createActivity] error: ' + err)
      return null
    }
  }

  async readActivity(actor_id: string, object_id: string): Promise<Activity> {
    const result = await this.activityModel.findOneAndUpdate(
      { actor_id: new mongoose.Types.ObjectId(actor_id), object_id: new mongoose.Types.ObjectId(object_id) },
      { isRead: true },
      { upsert: true }
    )
    return result
  }

  async removeActivity(actor_id: string, object_id: string): Promise<Activity> {
    const result = await this.activityModel.findOneAndRemove({
      actor_id: new mongoose.Types.ObjectId(actor_id),
      object_id: new mongoose.Types.ObjectId(object_id),
    })
    return result
  }

  async getActivities(userId: string): Promise<{ [key in ActivityVerbEnum]: Activity[] }> {
    const activities = await this.activityModel
      .find({
        object_id: userId,
        isRead: false,
      })
      .lean()

    const notifications: { [key in ActivityVerbEnum]: Activity[] } = {
      [ActivityVerbEnum.ADD_FRIEND]: [],
      [ActivityVerbEnum.INVITE_TO_SERVER]: [],
      [ActivityVerbEnum.MENTION]: [],
      [ActivityVerbEnum.NEW_MESSAGE_CHANNEL]: [],
      [ActivityVerbEnum.NEW_MESSAGE_P2P]: [],
    }

    activities.forEach((activity) => {
      notifications[activity.verb].push(activity)
    })

    return notifications
  }
}
