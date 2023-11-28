import { Controller, Get, Post, Body, Res, UseGuards, Req, Param, Delete } from '@nestjs/common'
import { Response, Request } from 'express'
import { JwtService } from '@nestjs/jwt'
import { ServersService } from './server.service'
import CreateServerDTO from 'src/dtos/create-server.dto'
import { ObjectId } from 'mongoose'
import { TokenVerifyGuard } from 'src/auth/tokenVerify.guard'
import { ChannelsService } from 'src/channels/channels.service'
import { User } from 'src/schemas/user.schema'
import { tokenConfig } from 'src/config/token.config'
import { UsersService } from 'src/users/users.service'
import AuthService from 'src/auth/auth.service'
import { BAD_REQUEST, SUCCESS } from 'src/consts/httpCodes'

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
      return res.status(401).json({ error: 'Authentication failed' })
    }
  }
}
