import { Inject, Injectable, UnauthorizedException, NotFoundException, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { randomUUID } from 'crypto'
import type { Redis } from 'ioredis'
import { AuthRepository } from './auth.repository'
import { SessionsRepository } from './sessions.repository'
import { TwilioService } from '../twilio/twilio.service'
import { REDIS_CLIENT } from '../redis/redis.module'
import type { JwtPayload } from '@battalion/types'

const OTP_COOLDOWN_TTL = 60       // seconds between request-otp calls per phone
const REFRESH_TOKEN_TTL = 2592000 // 30 days in seconds

function parseDeviceName(userAgent?: string): string {
  if (!userAgent) return 'Unknown device'
  if (/iPhone/.test(userAgent)) return 'iPhone'
  if (/iPad/.test(userAgent)) return 'iPad'
  if (/Android/.test(userAgent)) return 'Android'
  if (/Windows/.test(userAgent)) return 'Windows'
  if (/Macintosh/.test(userAgent)) return 'Mac'
  if (/Linux/.test(userAgent)) return 'Linux'
  return 'Unknown device'
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly repo: AuthRepository,
    private readonly sessionsRepo: SessionsRepository,
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

  async verifyOtp(phone: string, code: string, meta: { ip?: string; userAgent?: string }) {
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
    const refreshToken = this.jwt.sign(payload, { expiresIn: `${REFRESH_TOKEN_TTL}s` })

    await this.sessionsRepo.create({
      jti,
      soldierId: soldier.id,
      companyId: soldier.companyId,
      ip: meta.ip,
      userAgent: meta.userAgent,
      deviceName: parseDeviceName(meta.userAgent),
    })

    return { accessToken, refreshToken, soldier }
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = this.jwt.decode(refreshToken) as JwtPayload | null
      if (payload?.jti) {
        await this.sessionsRepo.deleteByJti(payload.jti)
      }
    } catch {
      // malformed token — nothing to revoke
    }
  }

  async listSessions(soldierId: string) {
    return this.sessionsRepo.listBySoldier(soldierId)
  }

  async revokeSession(soldierId: string, jti: string): Promise<{ ok: boolean }> {
    const session = await this.sessionsRepo.findByJti(jti)
    if (!session) throw new NotFoundException('Session not found')
    if (session.soldierId !== soldierId) throw new ForbiddenException()
    await this.sessionsRepo.deleteByJti(jti)
    return { ok: true }
  }
}
