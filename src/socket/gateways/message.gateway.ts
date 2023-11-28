import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { UsersService } from '../../users/users.service'
import { JwtService } from '@nestjs/jwt'
import { tokenConfig } from '../../config/token.config'
import { ObjectId } from 'mongoose'
import * as RTCMultiConnectionServer from 'rtcmulticonnection-server'

type Client = {
  userId: ObjectId
  clientId: string
  channelId?: ObjectId
}

@WebSocketGateway({ namespace: '/socket/message' })
export class MessageGateway {
  constructor(private usersService: UsersService, private jwtService: JwtService) {}
  private clients: Map<ObjectId, Client> = new Map()

  @WebSocketServer()
  server: Server

  async handleConnection(client: Socket) {
    console.log('connected')
    if (!client.handshake && client.handshake.auth && client.handshake.auth.accessToken) client.disconnect()

    try {
      console.log(client.handshake.auth.accessToken)
      const decoded = await this.jwtService.verifyAsync(client.handshake.auth.accessToken, {
        secret: tokenConfig.ACCESS_TOKEN_SECRET_KEY,
      })
      if (!decoded) client.disconnect()
      const _id = decoded._id
      const user = await this.usersService.getUserById(_id)
      if (!user) client.disconnect()
      this.clients.set(_id, { userId: _id, clientId: client.id })
      client.send('connected', 'asda')
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

  @SubscribeMessage('joinChannel')
  async handleStartGame(client: Socket, data: string) {
    const clientData: { _id: ObjectId; channelId: ObjectId } = JSON.parse(data)
    console.log('JOINED_ CHANNEL: ' + clientData.channelId)
    if (!this.clients.has(clientData._id)) client.disconnect()
    const user = await this.usersService.getUserById(clientData._id)
    if (!user) client.disconnect()

    if (this.clients.get(clientData._id).channelId) {
      const currentChannelId = this.clients.get(clientData._id).channelId
      let userIdsInChannels = []
      for (var [_, item] of this.clients) {
        if (item.channelId === currentChannelId && item.userId !== clientData._id) {
          userIdsInChannels.push(item.userId)
        }
      }
      this.server.emit(`receiveOnlineChannel=${currentChannelId}`, JSON.stringify(userIdsInChannels))
    }

    this.clients.set(clientData._id, {
      channelId: clientData.channelId,
      userId: clientData._id,
      clientId: client.id,
    })

    this.server.to(client.id).emit('joinedChannel', clientData.channelId)
    let userIdsInChannels = []
    for (var [_, item] of this.clients) {
      if (item.channelId === clientData.channelId) {
        userIdsInChannels.push(item.userId)
      }
    }
    this.server.emit(`receiveOnlineChannel=${clientData.channelId}`, JSON.stringify(userIdsInChannels))
  }

  @SubscribeMessage('leaveChannel')
  async handleLeaveChannel(client: Socket, data: string) {
    const clientData: { _id: ObjectId; channelId: ObjectId } = JSON.parse(data)
    if (!this.clients.has(clientData._id)) client.disconnect()
    const user = await this.usersService.getUserById(clientData._id)
    if (!user) client.disconnect()
    this.server.emit(`receiveMessageChannel=${clientData.channelId}`)
  }

  @SubscribeMessage('send')
  async handleSendMessage(client: Socket, data: string) {
    const clientData: { channelId: ObjectId; userId: ObjectId; message: string; fileIds: string[] } = JSON.parse(data)
    await this.usersService.sendMessage({
      channelId: clientData.channelId,
      message: clientData.message,
      userId: clientData.userId,
      fileIds: clientData.fileIds,
    })
    this.server.emit(`receiveMessageChannel=${clientData.channelId}`)
  }

  @SubscribeMessage('sendVoice')
  async handleSendVoice(client: Socket, data: string) {
    const clientData: { base64: string; serverId: string; userId: string } = JSON.parse(data)
    const newData: string[] = clientData.base64.split(';')
    newData[0] = 'data:audio/ogg;'
    const newDataString = newData[0] + newData[1]
    this.server.emit(`receiveVoiceServer=${clientData.serverId}`, JSON.stringify({ base64: newDataString, senderId: clientData.userId }))
  }

  @SubscribeMessage('joinVoice')
  handleJoinVoice(client: Socket, data: { serverId: string; offer: RTCSessionDescriptionInit }) {}
}
