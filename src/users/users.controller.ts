import { Controller, Get, Post, Body, Res, UseGuards, Req } from '@nestjs/common'
import { Response } from 'express'
import { JwtService } from '@nestjs/jwt'
import { UsersService } from './users.service'
import CreateUserDTO from '../dtos/create-user.dto'
import { tokenConfig } from '../config/token.config'
import { TokenVerifyGuard } from '../auth/tokenVerify.guard'
import { ObjectId } from 'mongoose'
import CreateAttachmentDTO from 'src/dtos/create-attachment.dto'

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService, private jwtService: JwtService) {}

  @Post('register')
  async create(@Body() createUserDTO: CreateUserDTO, @Res() res: Response) {
    const response = await this.service.create(createUserDTO)
    if (response) {
      return res.status(200).json(response)
    } else {
      return res.json({
        error: 'Error',
      })
    }
  }

  @Post('login')
  async login(@Body() userDTO: CreateUserDTO, @Res() res: Response) {
    const response = await this.service.login(userDTO)
    if (response) {
      const refreshToken = await this.jwtService.signAsync(
        {
          _id: response._id,
        },
        {
          secret: tokenConfig.REFRESH_TOKEN_SECRET_KEY,
          expiresIn: tokenConfig.refreshTokenExpiresIn.jwtService,
        }
      )
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        expires: new Date(Date.now() + tokenConfig.refreshTokenExpiresIn.cookies),
      })
      const accessToken = await this.jwtService.signAsync(
        {
          _id: response._id,
        },
        {
          secret: tokenConfig.ACCESS_TOKEN_SECRET_KEY,
          expiresIn: tokenConfig.accessTokenExpiresIn.jwtService,
        }
      )
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        expires: new Date(Date.now() + tokenConfig.accessTokenExpiresIn.cookies),
      })
      return res.status(200).json({
        ...response,
        accessToken,
        refreshToken,
      })
    } else {
      return res.json({
        error: 'Not find',
      })
    }
  }
  @Get('refresh-token')
  async getAccessTokenFromAccessToken() {}
  @Get('test-guard')
  @UseGuards(TokenVerifyGuard)
  async testGuard(@Req() req: any) {
    console.log(req.username)
    return ''
  }

  @Get('test-populate')
  async testPopulate(@Res() res: Response) {
    const response = await this.service.findUserByUsername('hoangvule100')
    return res.json(response)
  }

  @Post('join-server')
  async joinServer(@Body() body: { userId: ObjectId; serverId: ObjectId }, @Res() res: Response) {
    const response = await this.service.joinServer(body.userId, body.serverId)
    return res.json(response)
  }

  @Post('send-message')
  async sendMessage(@Body() body: { message: string; channelId: ObjectId; userId: ObjectId; attachmentIds: ObjectId[] }, @Res() res: Response) {
    const response = await this.service.sendMessage(body)
    return res.json(response)
  }

  @Post('get-users-by-ids')
  async getUsersByIds(@Body() body: ObjectId[], @Res() res: Response) {
    const response = await this.service.getUsersByIds(body)
    return res.status(200).json(response)
  }
}
