import { Body, Controller, Post, Res, Get, Param } from '@nestjs/common'

import { JwtService } from '@nestjs/jwt'
import { ChannelsService } from './channels.service'
import CreateChannelDTO from 'src/dtos/creacte-channel.dto'
import { Response } from 'express'
import { ObjectId } from 'mongoose'

@Controller('channels')
export class ChannelsController {
  constructor(private readonly service: ChannelsService, private jwtService: JwtService) {}

  @Post('create')
  async createChannel(@Body() body: CreateChannelDTO, @Res() res: Response) {
    const response = await this.service.createChannel(body)
    return res.json(response)
  }

  @Get('message-history/:channelId')
  async getMessageHistory(@Param() param: { channelId: ObjectId }, @Res() res: Response) {
    const response = await this.service.getChannelMessageHistory(param.channelId)
    return res.status(200).json(response)
  }
}
