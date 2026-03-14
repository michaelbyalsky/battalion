import { Controller, Post, Body, Res, HttpCode } from '@nestjs/common'
import type { Response } from 'express'
import { AuthService } from './auth.service'
import { RequestOtpDto, VerifyOtpDto } from './dto'

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('request-otp')
  @HttpCode(200)
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.auth.requestOtp(dto.phone)
  }

  @Post('verify-otp')
  @HttpCode(200)
  async verifyOtp(@Body() dto: VerifyOtpDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.auth.verifyOtp(dto.phone, dto.code)
    res.cookie('access_token', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' })
    res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' })
    return { ok: true }
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token')
    res.clearCookie('refresh_token')
    return { ok: true }
  }
}
