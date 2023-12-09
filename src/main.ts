import { NestFactory } from '@nestjs/core'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import * as express from 'express'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.use(cors({ credentials: true, origin: process.env.CLIENT_HOST_URL }))
  app.use(cookieParser())
  app.use(express.json({ limit: '50mb' }))
  app.use(express.urlencoded({ limit: '50mb' }))
  app.useGlobalPipes(new ValidationPipe())
  const PORT = process.env.PORT || 3001
  await app.listen(PORT)
}
bootstrap()
