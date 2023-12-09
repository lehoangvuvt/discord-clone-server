import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { UsersService } from '../../users/users.service'
import { JwtService } from '@nestjs/jwt'
import { tokenConfig } from '../../config/token.config'
import { createClient } from 'redis'

type Client = {
  userId: string
  clientId: string
  channelId?: string
  serverId?: string
}

@WebSocketGateway({ namespace: '/socket/message' })
export class MessageGateway {
  @WebSocketServer()
  server: Server
  private clients: Map<string, Client> = new Map()
  private redisClient = createClient({
    url: process.env.REDIS_PRIVATE_URL ?? process.env.REDIS_LOCAL_URL,
  })
  constructor(private usersService: UsersService, private jwtService: JwtService) {
    this.redisClient.connect()
    this.server = new Server({
      path: '/socket/message',
    })
    if (this.server) {
      console.log('has')
      this.redisClient.subscribe('message-to-channel', (data: string) => {
        this.server.to(data).emit(`receiveMessageChannel`)
      })
    }
  }

  async authenticate(_id: string) {
    if (!this.clients.has(_id)) return false
    const user = await this.usersService.getUserById(_id)
    if (!user) return false
    return true
  }

  async handleConnection(client: Socket) {
    if (!client.handshake && client.handshake.auth && client.handshake.auth.accessToken) client.disconnect()
    try {
      const decoded = await this.jwtService.verifyAsync(client.handshake.auth.accessToken, {
        secret: tokenConfig.ACCESS_TOKEN_SECRET_KEY,
      })
      if (!decoded) client.disconnect()
      const _id = decoded._id
      const user = await this.usersService.getUserById(_id)
      if (!user) client.disconnect()
      this.clients.set(_id, { userId: _id, clientId: client.id, channelId: null, serverId: null })
      client.send('connected', 'asda')
      console.log('connected')
    } catch (err) {
      console.log(err)
      console.log('Disconnected')
      client.disconnect()
    }
  }

  @SubscribeMessage('disconnect')
  async handleDisconnect(client: Socket, data: string) {
    for (let [key, value] of this.clients) {
      if (value.clientId === client.id) {
        this.clients.delete(key)
      }
    }
  }

  @SubscribeMessage('joinServer')
  async handleJoinServer(client: Socket, data: string) {
    const clientData: { _id: string; serverId: string } = JSON.parse(data)
    const { _id, serverId } = clientData

    const isAuth = await this.authenticate(_id)
    if (!isAuth) return client.disconnect()

    const existedClient = this.clients.get(_id)
    const currentChannelId = existedClient.channelId
    const currentServerId = existedClient.serverId

    if (currentChannelId) {
      client.leave(currentChannelId)
      console.log('[handleJoinServer] client.leave(currentChannelId)')
    }

    if (currentServerId) {
      client.leave(currentServerId)
      console.log('[handleJoinServer] client.leave(currentServerId)')
    }

    client.join(serverId)
    console.log('[handleJoinServer] client.join(serverId): ' + serverId)

    this.clients.set(_id, {
      ...this.clients.get(_id),
      serverId: serverId,
      clientId: client.id,
    })

    this.server.to(client.id).emit('joinedServer', serverId)
  }

  @SubscribeMessage('leaveServer')
  async handleLeaveServer(client: Socket, data: string) {
    const clientData: { _id: string } = JSON.parse(data)
    const { _id } = clientData

    const isAuth = await this.authenticate(_id)
    if (!isAuth) return client.disconnect()

    const existedClient = this.clients.get(_id)
    const currentChannelId = existedClient.channelId
    const currentServerId = existedClient.serverId

    if (currentChannelId) {
      client.leave(currentChannelId)
      console.log('[leaveChannel] client.leave(currentChannelId)')
    }

    if (currentServerId) {
      client.leave(currentServerId)
      console.log('[leaveChannel] client.leave(currentServerId)')
    }

    this.clients.set(_id, {
      ...this.clients.get(_id),
      channelId: null,
      serverId: null,
    })
  }

  @SubscribeMessage('joinChannel')
  async handleJoinChannel(client: Socket, data: string) {
    const clientData: { _id: string; channelId: string } = JSON.parse(data)
    const { _id, channelId } = clientData

    const isAuth = await this.authenticate(_id)
    if (!isAuth) return client.disconnect()

    const currentChannelId = this.clients.get(_id).channelId
    if (currentChannelId) {
      client.leave(currentChannelId)
      console.log('[joinChannel] client.leave(currentChannelId)')
      let userIdsInChannels = []
      for (var [_, item] of this.clients) {
        if (item.channelId === currentChannelId && item.userId !== _id) {
          userIdsInChannels.push(item.userId)
        }
      }
      this.server.to(channelId).emit(`receiveOnlineChannel`, JSON.stringify(userIdsInChannels))
    }

    client.join(channelId)
    console.log('[joinChannel] client.join(channelId): ' + channelId)

    this.clients.set(_id, {
      ...this.clients.get(_id),
      channelId: channelId,
      clientId: client.id,
    })

    this.server.to(client.id).emit('joinedChannel', channelId)

    let userIdsInChannels = []
    for (var [_, item] of this.clients) {
      if (item.channelId === channelId) {
        userIdsInChannels.push(item.userId)
      }
    }

    this.server.to(channelId).emit(`receiveOnlineChannel`, JSON.stringify(userIdsInChannels))
  }

  @SubscribeMessage('leaveChannel')
  async handleLeaveChannel(client: Socket, data: string) {
    const clientData: { _id: string } = JSON.parse(data)
    const { _id } = clientData

    const isAuth = await this.authenticate(_id)
    if (!isAuth) return client.disconnect()

    if (this.clients.get(_id).channelId) {
      const currentChannelId = this.clients.get(_id).channelId
      client.leave(currentChannelId)
      this.clients.set(_id, {
        ...this.clients.get(_id),
        channelId: null,
      })
      console.log('[leaveChannel] client.leave(currentChannelId): ' + currentChannelId)
    }
  }

  @SubscribeMessage('send')
  async handleSendMessage(client: Socket, data: string) {
    const clientData: { channelId: string; userId: string; message: string; fileIds: string[]; receiverId: string; type: 'channel' | 'p2p' } = JSON.parse(data)
    const { channelId, fileIds, message, receiverId, type, userId } = clientData

    const isAuth = await this.authenticate(userId)
    if (!isAuth) return client.disconnect()

    await this.usersService.sendMessage({
      channelId: channelId,
      message: message,
      userId: userId,
      fileIds: fileIds,
    })
    // if (type === 'channel') {
    //   this.server.emit(`receiveMessageChannel=${clientData.channelId}`)
    // }
  }

  @SubscribeMessage('sendVoice')
  async handleSendVoice(client: Socket, data: string) {
    const clientData: { base64: string; userId: string } = JSON.parse(data)
    const { base64, userId } = clientData

    const isAuth = await this.authenticate(userId)
    if (!isAuth) return client.disconnect()
    if (!this.clients.get(userId).serverId) return client.disconnect()

    const currentServerId = this.clients.get(userId).serverId
    const newData: string[] = base64.split(';')
    newData[0] = 'data:audio/ogg;'
    const newDataString = newData[0] + newData[1]

    this.server.to(currentServerId).emit(`receiveVoiceServer`, JSON.stringify({ base64: newDataString, senderId: userId }))
  }

  @SubscribeMessage('updateActivities')
  async handleUpdatePendingRequest(client: Socket, data: string) {
    const clientData: { targetUserId: string } = JSON.parse(data)
    if (this.clients.get(clientData.targetUserId)) {
      const clientId = this.clients.get(clientData.targetUserId).clientId
      this.server.to(clientId).emit('updateActivities')
    }
  }

  @SubscribeMessage('sendP2PMessage')
  async handleJoinP2P(client: Socket, data: string) {
    const clientData: { userId: string; message: string; fileIds: string[]; receiverId: string } = JSON.parse(data)
    const { userId, message, fileIds, receiverId } = clientData

    const isAuth = await this.authenticate(userId)
    if (!isAuth) return client.disconnect()

    const response = await this.usersService.sendP2PMessage({
      message: message,
      userId: userId,
      fileIds: fileIds,
      receiverId: receiverId,
    })

    const receiverClient = this.clients.get(receiverId)
    if (receiverClient) {
      this.server.to(receiverClient.clientId).emit(`receiveP2PMessage`)
    }
    this.server.to(client.id).emit(`receiveP2PMessage`)
  }
}
