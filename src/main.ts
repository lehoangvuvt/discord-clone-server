import { NestFactory } from '@nestjs/core'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.use(cors())
  app.use(cookieParser())
  app.useGlobalPipes(new ValidationPipe())
  await app.listen(3001)
}
bootstrap()
