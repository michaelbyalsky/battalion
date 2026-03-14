import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import cookieParser from 'cookie-parser'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.use(cookieParser())
  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

  app.enableCors({
    origin: process.env.WEB_URL ?? 'http://localhost:3001',
    credentials: true,
  })

  await app.listen(process.env.PORT ?? 3000)
  console.log(`API running on http://localhost:${process.env.PORT ?? 3000}`)
}

bootstrap()
