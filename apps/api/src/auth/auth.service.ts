import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AuthRepository } from './auth.repository'

// OTP whitelist for dev/staging
const DEV_PHONES = ['+972500000001', '+972500000002', '+972500000003']
const DEV_OTP = '123456'

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly repo: AuthRepository,
  ) {}

  async requestOtp(phone: string): Promise<{ ok: boolean }> {
    const soldier = await this.repo.findSoldierByPhone(phone)
    if (!soldier) throw new NotFoundException('Phone not registered')

    if (DEV_PHONES.includes(phone)) {
      console.log(`[DEV] OTP for ${phone}: ${DEV_OTP}`)
      return { ok: true }
    }

    // TODO: Send via Twilio
    return { ok: true }
  }

  async verifyOtp(phone: string, code: string): Promise<{ accessToken: string; refreshToken: string }> {
    const soldier = await this.repo.findSoldierByPhone(phone)
    if (!soldier) throw new UnauthorizedException()

    const isValid = DEV_PHONES.includes(phone) ? code === DEV_OTP : false // TODO: Redis OTP check
    if (!isValid) throw new UnauthorizedException('Invalid OTP')

    const company = await this.repo.findCompanyById(soldier.companyId)
    if (!company) throw new UnauthorizedException('Company not found')

    const payload = {
      sub: soldier.id,
      battalion_id: company.battalionId,
      company_id: soldier.companyId,
      battalion_scope: company.type === 'support',
      role: soldier.role,
    }
    const accessToken = this.jwt.sign(payload)
    const refreshToken = this.jwt.sign(payload, { expiresIn: '30d' })

    return { accessToken, refreshToken }
  }
}
