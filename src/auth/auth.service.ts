import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { tokenConfig } from '../config/token.config'
import { User } from 'src/schemas/user.schema'
import { UsersService } from 'src/users/users.service'

@Injectable()
export default class AuthService {
  constructor(private readonly jwtService: JwtService, private readonly usersService: UsersService) {}

  async signToken(type: 'refresh_token' | 'access_token', dataToSign: any): Promise<string> {
    let token = ''
    switch (type) {
      case 'access_token':
        token = await this.jwtService.signAsync(dataToSign, {
          secret: tokenConfig.ACCESS_TOKEN_SECRET_KEY,
          expiresIn: tokenConfig.accessToken.expiresIn,
        })
        break
      case 'refresh_token':
        token = await this.jwtService.signAsync(dataToSign, {
          secret: tokenConfig.REFRESH_TOKEN_SECRET_KEY,
          expiresIn: tokenConfig.refreshToken.expiresIn,
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
        const result = await this.usersService.getUserByIdAuthentication(userId)
        if (!result) return false
        return result
      }
    } catch (error) {
      return false
    }
  }
}
