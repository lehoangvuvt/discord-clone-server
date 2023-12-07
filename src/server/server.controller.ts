import { Controller, Get, Post, Body, Res, UseGuards, Req, Param, Delete, Put } from '@nestjs/common'
import { Response, Request } from 'express'
import { JwtService } from '@nestjs/jwt'
import { ServersService } from './server.service'
import CreateServerDTO from 'src/dtos/create-server.dto'
import { ObjectId } from 'mongoose'
import { TokenVerifyGuard } from 'src/auth/tokenVerify.guard'
import { ChannelsService } from 'src/channels/channels.service'
import AuthService from 'src/auth/auth.service'
import { BAD_REQUEST, SUCCESS, UN_AUTHENTICATED } from 'src/consts/httpCodes'

@Controller('servers')
export class ServersController {
  constructor(private readonly service: ServersService, private readonly channelService: ChannelsService, private readonly authService: AuthService) {}

  @UseGuards(TokenVerifyGuard)
  @Post('create')
  async create(@Req() req: any, @Body() serverDTO: CreateServerDTO, @Res() res: Response) {
    const response = await this.service.createServer(serverDTO, req._id)

    if (response) {
      await this.channelService.createChannel({ name: 'General', serverId: response._id })
      return res.status(200).json(response)
    } else {
      return res.status(400).send({ error: 'Error at create server.' })
    }
  }

  @Get(':serverId')
  async getServerInfp(@Param() param: { serverId: string }, @Res() res: Response) {
    const result = await this.service.getServerInfo(param.serverId)
    return res.status(200).json(result)
  }

  @Get('get-channels/:serverId')
  async getServerChannels(@Param() param: { serverId: ObjectId }, @Res() res: Response) {
    const response = await this.service.getServerChannels(param.serverId)
    return res.status(200).json(response)
  }

  @Delete('leave/serverId=:serverId')
  async leaveServer(@Param() param: { serverId: string }, @Req() request: Request, @Res() res: Response) {
    if (request.cookies && request.cookies['access_token']) {
      const accessToken = request.cookies['access_token']
      const validateToken = await this.authService.validateToken('access_token', accessToken)
      if (!validateToken) return res.status(401).json({ error: 'Authentication failed' })
      const response = await this.service.leaveServer(param.serverId, validateToken._id)
      if (!response) return res.status(BAD_REQUEST).json({ error: 'Something error' })
      return res.status(SUCCESS).json(response)
    } else {
      return res.status(UN_AUTHENTICATED).json({ error: 'Authentication failed' })
    }
  }

  @UseGuards(TokenVerifyGuard)
  @Post('create/server-invitation/:serverId')
  async createServerInvitation(@Param() param: { serverId: string }, @Req() req: any, @Res() res: Response) {
    const userId = req._id
    const user = await this.authService.validateUserId(userId)
    if (!user) return res.status(UN_AUTHENTICATED).json({ error: 'Authentication failed' })
    const response = await this.service.createServerInvitation(param.serverId, userId)
    if (!response) return res.status(BAD_REQUEST).json({ error: 'Something error' })
    return res.status(SUCCESS).json(response)
  }

  @Get('server-invitation/:invitationId')
  async getServerInvitationDetails(@Param() param: { invitationId: string }, @Req() req: any, @Res() res: Response) {
    const response = await this.service.getServerInvitationDetails(param.invitationId)
    return res.status(SUCCESS).json(response)
  }

  @UseGuards(TokenVerifyGuard)
  @Get('use/server-invitation/:invitationId')
  async useServerInvitation(@Param() param: { invitationId: string }, @Req() req: any, @Res() res: Response) {
    const userId = req._id
    const response = await this.service.useServerInvitation(param.invitationId, userId)
    if (response.status === 'Error') return res.status(BAD_REQUEST).json({ error: response.errorMsg })
    return res.status(SUCCESS).json(response)
  }
}
