import { Controller, Post, Body, Res, Req, HttpCode } from '@nestjs/common'
import type { Request, Response } from 'express'
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
    const { accessToken, refreshToken, soldier } = await this.auth.verifyOtp(dto.phone, dto.code)
    const cookieOpts = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const }
    res.cookie('access_token', accessToken, cookieOpts)
    res.cookie('refresh_token', refreshToken, cookieOpts)
    return { soldier }
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken: string | undefined = req.cookies?.refresh_token
    if (refreshToken) await this.auth.logout(refreshToken)
    res.clearCookie('access_token')
    res.clearCookie('refresh_token')
    return { ok: true }
  }
}
