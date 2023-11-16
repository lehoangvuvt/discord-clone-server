export const tokenConfig = {
  REFRESH_TOKEN_SECRET_KEY: 'REFRESH_TOKEN_SECRET_KEY',
  ACCESS_TOKEN_SECRET_KEY: 'ACCESS_TOKEN_SECRET_KEY',
  refreshTokenExpiresIn: {
    jwtService: '1d',
    cookies: 24 * 60 * 60 * 1000,
  },
  accessTokenExpiresIn: {
    jwtService: '1h',
    cookies: 60 * 60 * 1000,
  },
}
