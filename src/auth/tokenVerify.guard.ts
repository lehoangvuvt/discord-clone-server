import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { tokenConfig } from '../config/token.config'

@Injectable()
export class TokenVerifyGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    if (request.cookies && request.cookies['access_token']) {
      const access_token = request.cookies['access_token']
      try {
        const decoded = await this.jwtService.verifyAsync(access_token, {
          secret: tokenConfig.ACCESS_TOKEN_SECRET_KEY,
        })
        if (!decoded) {
          return false
        } else {
          request._id = decoded._id
          return true
        }
      } catch (error) {
        return false
      }
    } else if (!request.cookies['access_token']) {
      return false
    }
  }
}
