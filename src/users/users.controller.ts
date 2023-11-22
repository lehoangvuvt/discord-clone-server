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

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService, private jwtService: JwtService) {}

  async signToken(type: 'refresh_token' | 'access_token', dataToSign: any): Promise<string> {
    let token = ''
    switch (type) {
      case 'access_token':
        token = await this.jwtService.signAsync(dataToSign, {
          secret: tokenConfig.ACCESS_TOKEN_SECRET_KEY,
          expiresIn: tokenConfig.refreshTokenExpiresIn.jwtService,
        })
        break
      case 'refresh_token':
        token = await this.jwtService.signAsync(dataToSign, {
          secret: tokenConfig.REFRESH_TOKEN_SECRET_KEY,
          expiresIn: tokenConfig.refreshTokenExpiresIn.jwtService,
        })
        break
    }
    return token
  }

  async validateToken(type: 'refresh_token' | 'access_token', value: string): Promise<User | false> {
    try {
      const decoded = await this.jwtService.verifyAsync(value, {
        secret: type === 'access_token' ? tokenConfig.ACCESS_TOKEN_SECRET_KEY : tokenConfig.REFRESH_TOKEN_SECRET_KEY,
      })
      if (!decoded) {
        return false
      } else {
        const userId = decoded._id
        const result = await this.service.getUserByIdAuthentication(userId)
        if (!result) return false
        return result
      }
    } catch (error) {
      return false
    }
  }

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
      const refreshToken = await this.signToken('refresh_token', { _id: response._id })
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        expires: new Date(Date.now() + tokenConfig.refreshTokenExpiresIn.cookies),
        sameSite: 'none',
        secure: true,
      })
      const accessToken = await this.signToken('access_token', { _id: response._id })
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        expires: new Date(Date.now() + tokenConfig.accessTokenExpiresIn.cookies),
        sameSite: 'none',
        secure: true,
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
  async getAccessTokenFromAccessToken(@Req() req: any, @Res() res: Response) {
    if (req.cookies && req.cookies['refresh_token']) {
      const refresh_token = req.cookies['refresh_token']
      const validateToken = await this.validateToken('refresh_token', refresh_token)
      if (!validateToken) return res.status(401).json({ error: 'Refresh token invalid' })
      const accessToken = await this.signToken('access_token', { _id: validateToken._id })
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        expires: new Date(Date.now() + tokenConfig.accessTokenExpiresIn.cookies),
        sameSite: 'none',
        secure: true,
      })
      return res.status(200).json(validateToken)
    } else {
      return res.status(401).json({ error: 'Refresh token invalid' })
    }
  }

  @Get('authentication')
  async anthentication(@Req() request: any, @Res() res: Response) {
    if (request.cookies && request.cookies['access_token']) {
      const accessToken = request.cookies['access_token']
      const refreshToken = request.cookies['refresh_token']
      const validateToken = await this.validateToken('access_token', accessToken)
      if (!validateToken) return res.status(401).json({ error: 'Authentication failed' })
      return res.status(200).json({ ...validateToken, accessToken, refreshToken })
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

  @UseGuards(TokenVerifyGuard)
  @Post('update')
  async updateUserInfo(@Body() body: User, @Req() req: any, @Res() res: Response) {
    const updatedUserInfo = body
    const userId = req._id
    delete updatedUserInfo.password
    delete updatedUserInfo._id
    const response = await this.service.updateUserInfo(updatedUserInfo, userId)
    if (!response) return res.status(400).json({ error: 'Cannot update user info' })
    return res.status(200).json(response)
  }
}
