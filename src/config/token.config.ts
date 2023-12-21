import { CookieOptions } from 'express'
import dotenv from 'dotenv'
dotenv.config({ path: '.env' })

const commonOptions: CookieOptions = {
  sameSite: 'none',
  secure: true,
  httpOnly: true,
}

const accessTokenCookieOptions: CookieOptions = {
  ...commonOptions,
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
}

const refreshTokenCookieOptions: CookieOptions = {
  ...commonOptions,
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
}

export const tokenConfig = {
  REFRESH_TOKEN_SECRET_KEY: process.env.REFRESH_TOKEN_SECRET_KEY,
  ACCESS_TOKEN_SECRET_KEY: process.env.ACCESS_TOKEN_SECRET_KEY,
  refreshToken: {
    expiresIn: '7d',
    cookieOptions: refreshTokenCookieOptions,
  },
  accessToken: {
    expiresIn: '1h',
    cookieOptions: accessTokenCookieOptions,
  },
}
