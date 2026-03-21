import { Inject, Injectable, UnauthorizedException, NotFoundException, HttpException, HttpStatus } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { randomUUID } from 'crypto'
import type { Redis } from 'ioredis'
import { AuthRepository } from './auth.repository'
import { TwilioService } from '../twilio/twilio.service'
import { REDIS_CLIENT } from '../redis/redis.module'

const OTP_COOLDOWN_TTL = 60      // seconds between request-otp calls
const REFRESH_TOKEN_TTL = 2592000 // 30 days in seconds

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly repo: AuthRepository,
    private readonly twilio: TwilioService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async requestOtp(phone: string): Promise<{ ok: boolean }> {
    const soldier = await this.repo.findSoldierByPhone(phone)
    if (!soldier) throw new NotFoundException('Phone not registered')

    const cooldown = await this.redis.get(`otp_cooldown:${phone}`)
    if (cooldown) throw new HttpException('Please wait before requesting a new code', HttpStatus.TOO_MANY_REQUESTS)

    await this.twilio.sendOtp(phone)
    await this.redis.set(`otp_cooldown:${phone}`, '1', 'EX', OTP_COOLDOWN_TTL)

    return { ok: true }
  }

  async verifyOtp(phone: string, code: string) {
    const soldier = await this.repo.findSoldierByPhone(phone)
    if (!soldier) throw new UnauthorizedException()

    const approved = await this.twilio.checkOtp(phone, code)
    if (!approved) throw new UnauthorizedException('Invalid OTP')

    const company = await this.repo.findCompanyById(soldier.companyId)
    if (!company) throw new UnauthorizedException('Company not found')

    const jti = randomUUID()
    const payload = {
      sub: soldier.id,
      jti,
      battalion_id: company.battalionId,
      company_id: soldier.companyId,
      battalion_scope: company.type === 'support',
      role: soldier.role,
    }
    const accessToken = this.jwt.sign(payload)
    const refreshToken = this.jwt.sign(payload, { expiresIn: '30d' })

    await this.redis.set(`refresh:${jti}`, soldier.id, 'EX', REFRESH_TOKEN_TTL)

    return { accessToken, refreshToken, soldier }
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = this.jwt.decode(refreshToken) as { jti?: string } | null
      if (payload?.jti) {
        await this.redis.del(`refresh:${payload.jti}`)
      }
    } catch {
      // token malformed — nothing to revoke, proceed with cookie clearing
    }
  }
}
