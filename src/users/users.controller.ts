import { Controller, Get, Post, Body, Res, UseGuards, Req, Param } from '@nestjs/common'
import { Response } from 'express'
import { JwtService } from '@nestjs/jwt'
import { UsersService } from './users.service'
import CreateUserDTO from '../dtos/create-user.dto'
import { tokenConfig } from '../config/token.config'
import { TokenVerifyGuard } from '../auth/tokenVerify.guard'
import { ObjectId } from 'mongoose'
import UploadFileDTO from 'src/dtos/upload-file.dto'

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

  @Get('authentication')
  async anthentication(@Req() request: any, @Res() res: Response) {
    if (request.cookies && request.cookies['access_token']) {
      const access_token = request.cookies['access_token']
      try {
        const decoded = await this.jwtService.verifyAsync(access_token, {
          secret: tokenConfig.ACCESS_TOKEN_SECRET_KEY,
        })
        if (!decoded) {
          return false
        } else {
          const userId = decoded._id
          const result = await this.service.getUserByIdAuthentication(userId)
          if (!result) return res.status(401).json({ error: 'Authentication failed' })
          return res.status(200).json(result)
        }
      } catch (error) {
        return res.status(401).json({ error: 'Authentication failed' })
      }
    } else {
      return res.status(401).json({ error: 'Authentication failed' })
    }
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
  async sendMessage(@Body() body: { message: string; channelId: ObjectId; userId: ObjectId; fileIds: string[] }, @Res() res: Response) {
    const response = await this.service.sendMessage(body)
    return res.json(response)
  }

  @Post('get-users-by-ids')
  async getUsersByIds(@Body() body: ObjectId[], @Res() res: Response) {
    const response = await this.service.getUsersByIds(body)
    return res.status(200).json(response)
  }

  @Post('find')
  async findUsers(@Body() body: { keyword: string }, @Res() res: Response) {
    const result = await this.service.findUsers(body.keyword)
    return res.status(200).json(result)
  }

  @Post('upload-avatar')
  async upload(@Body() uploadFileDTO: UploadFileDTO, @Res() res: Response) {
    const response = await this.service.uploadFile(uploadFileDTO)
    if (response) {
      return res.status(200).json(response)
    } else {
      return res.status(401).send({ error: 'Error at upload file: ' + uploadFileDTO.name })
    }
  }
}
