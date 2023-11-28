import { CookieOptions } from 'express'

import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const tokenCookiesOpts: {
  refreshToken: CookieOptions
  accessToken: CookieOptions
} = {
  accessToken: {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    sameSite: 'none',
    secure: true,
  },
  refreshToken: {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    sameSite: 'none',
    secure: true,
  },
}

export const tokenConfig = {
  REFRESH_TOKEN_SECRET_KEY: process.env.REFRESH_TOKEN_SECRET_KEY,
  ACCESS_TOKEN_SECRET_KEY: process.env.ACCESS_TOKEN_SECRET_KEY,
  refreshToken: {
    expiresIn: '7d',
    cookieOptions: tokenCookiesOpts.refreshToken,
  },
  accessToken: {
    expiresIn: '1h',
    cookieOptions: tokenCookiesOpts.accessToken,
  },
}
