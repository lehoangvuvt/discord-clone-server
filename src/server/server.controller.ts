import { Controller, Get, Post, Body, Res, UseGuards, Req, Param } from '@nestjs/common'
import { Response } from 'express'
import { JwtService } from '@nestjs/jwt'
import { ServersService } from './server.service'
import CreateServerDTO from 'src/dtos/create-server.dto'
import { ObjectId } from 'mongoose'

@Controller('servers')
export class ServersController {
  constructor(private readonly service: ServersService, private jwtService: JwtService) {}

  @Post('create')
  async create(@Body() serverDTO: CreateServerDTO, @Res() res: Response) {
    const response = await this.service.createServer(serverDTO)
    if (response) {
      return res.status(200).json(response)
    } else {
      return res.status(401).send({ error: 'Error at create server.' })
    }
  }

  @Get('get-channels/:serverId')
  async getServerChannels(@Param() param: { serverId: ObjectId }, @Res() res: Response) {
    const response = await this.service.getServerChannels(param.serverId)
    return res.status(200).json(response)
  }
}
