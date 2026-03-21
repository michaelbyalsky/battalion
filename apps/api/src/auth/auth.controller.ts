import { Controller, Post, Get, Delete, Body, Res, Req, Param, HttpCode, UseGuards } from '@nestjs/common'
import type { Request, Response } from 'express'
import type { JwtPayload } from '@battalion/types'
import { AuthService } from './auth.service'
import { RequestOtpDto, VerifyOtpDto } from './dto'
import { JwtGuard } from '../common/guards/jwt.guard'

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
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, soldier } = await this.auth.verifyOtp(dto.phone, dto.code, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })
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

  @Get('sessions')
  @UseGuards(JwtGuard)
  listSessions(@Req() req: Request) {
    const user = req.user as JwtPayload
    return this.auth.listSessions(user.sub)
  }

  @Delete('sessions/:jti')
  @UseGuards(JwtGuard)
  @HttpCode(200)
  revokeSession(@Param('jti') jti: string, @Req() req: Request) {
    const user = req.user as JwtPayload
    return this.auth.revokeSession(user.sub, jti)
  }
}
