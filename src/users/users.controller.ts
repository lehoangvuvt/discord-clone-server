import { Controller, Get, Post, Body, Res, UseGuards, Req, Param } from '@nestjs/common'
import { Response } from 'express'
import { JwtService } from '@nestjs/jwt'
import { UsersService } from './users.service'
import CreateUserDTO from '../dtos/create-user.dto'
import { tokenConfig } from '../config/token.config'
import { ObjectId } from 'mongoose'
import UploadFileDTO from 'src/dtos/upload-file.dto'
import { User } from 'src/schemas/user.schema'
import { TokenVerifyGuard } from 'src/auth/tokenVerify.guard'
import { SUCCESS, UN_AUTHENTICATED } from 'src/consts/httpCodes'
import AuthService from 'src/auth/auth.service'

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService, private readonly authSerivce: AuthService) {}

  @Post('register')
  async create(@Body() createUserDTO: CreateUserDTO, @Res() res: Response) {
    const response = await this.service.create(createUserDTO)
    if (response) {
      return res.status(SUCCESS).json(response)
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
      const refreshToken = await this.authSerivce.signToken('refresh_token', { _id: response._id })
      res.cookie('refresh_token', refreshToken, tokenConfig.refreshToken.cookieOptions)
      const accessToken = await this.authSerivce.signToken('access_token', { _id: response._id })
      res.cookie('access_token', accessToken, tokenConfig.accessToken.cookieOptions)

      return res.status(SUCCESS).json({
        ...response,
        accessToken,
        refreshToken,
      })
    } else {
      return res.status(UN_AUTHENTICATED).json({
        error: 'Not find',
      })
    }
  }

  @Get('refresh-token')
  async getAccessTokenFromAccessToken(@Req() req: any, @Res() res: Response) {
    if (req.cookies && req.cookies['refresh_token']) {
      const refresh_token = req.cookies['refresh_token']
      const validateToken = await this.authSerivce.validateToken('refresh_token', refresh_token)
      if (!validateToken) return res.status(401).json({ error: 'Refresh token invalid' })
      const accessToken = await this.authSerivce.signToken('access_token', { _id: validateToken._id })
      res.cookie('access_token', accessToken, tokenConfig.accessToken.cookieOptions)
      return res.status(SUCCESS).json(validateToken)
    } else {
      return res.status(401).json({ error: 'Refresh token invalid' })
    }
  }

  @Get('authentication')
  async anthentication(@Req() request: any, @Res() res: Response) {
    if (request.cookies && request.cookies['access_token']) {
      const accessToken = request.cookies['access_token']
      const refreshToken = request.cookies['refresh_token']
      const validateToken = await this.authSerivce.validateToken('access_token', accessToken)
      if (!validateToken) return res.status(401).json({ error: 'Authentication failed' })
      return res.status(SUCCESS).json({ ...validateToken, accessToken, refreshToken })
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
    return res.status(SUCCESS).json(response)
  }

  @Post('find')
  async findUsers(@Body() body: { keyword: string }, @Res() res: Response) {
    const result = await this.service.findUsers(body.keyword)
    return res.status(SUCCESS).json(result)
  }

  @Post('upload-avatar')
  async upload(@Body() uploadFileDTO: UploadFileDTO, @Res() res: Response) {
    const response = await this.service.uploadFile(uploadFileDTO)
    if (response) {
      return res.status(SUCCESS).json(response)
    } else {
      return res.status(401).send({ error: 'Error at upload file: ' + uploadFileDTO.name })
    }
  }

  @UseGuards(TokenVerifyGuard)
  @Post('update')
  async updateUserInfo(@Body() body: User, @Req() req: any, @Res() res: Response) {
    const updatedUserInfo = body
    const userId = req._id
    delete updatedUserInfo.password
    delete updatedUserInfo._id
    const response = await this.service.updateUserInfo(updatedUserInfo, userId)
    if (!response) return res.status(400).json({ error: 'Cannot update user info' })
    return res.status(SUCCESS).json(response)
  }
}
