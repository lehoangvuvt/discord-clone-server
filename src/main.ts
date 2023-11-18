import { NestFactory } from '@nestjs/core'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import * as express from 'express'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.use(cors())
  app.use(cookieParser())
  app.use(express.json({ limit: '50mb' }))
  app.use(express.urlencoded({ limit: '50mb' }))
  app.useGlobalPipes(new ValidationPipe())
  await app.listen(3001)
}
bootstrap()
