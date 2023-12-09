import { Body, Controller, Post, Res, Get, Param, UseInterceptors } from '@nestjs/common'

import { JwtService } from '@nestjs/jwt'
import { ChannelsService } from './channels.service'
import CreateChannelDTO from 'src/dtos/creacte-channel.dto'
import { Response } from 'express'
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager'

@Controller('channels')
export class ChannelsController {
  constructor(private readonly service: ChannelsService, private jwtService: JwtService) {}

  @Post('create')
  async createChannel(@Body() body: CreateChannelDTO, @Res() res: Response) {
    const response = await this.service.createChannel(body)
    return res.json(response)
  }

  @Get('message-history/channelId=:channelId&page=:page&limit=:limit')
  async getMessageHistory(@Param() param: { channelId: string; page: number; limit: number }, @Res() res: Response) {
    const response = await this.service.getChannelMessageHistory(param.channelId, parseInt(param.page.toString()), parseInt(param.limit.toString()))
    return res.status(200).json(response)
  }
  @Get('new-messages/channelId=:channelId&dateTime=:datetime')
  async getNewMessages(@Param() param: { channelId: string; datetime: string }, @Res() res: Response) {
    const response = await this.service.getNewMessagesSinceDT(param.channelId, param.datetime)
    return res.status(200).json(response)
  }
}
