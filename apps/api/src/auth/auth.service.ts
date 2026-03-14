import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { db, soldiers } from '@company/db'
import { eq } from 'drizzle-orm'

// OTP whitelist for dev/staging
const DEV_PHONES = ['+972500000001', '+972500000002', '+972500000003']
const DEV_OTP = '123456'

@Injectable()
export class AuthService {
  constructor(private jwt: JwtService) {}

  async requestOtp(phone: string): Promise<{ ok: boolean }> {
    const soldier = await db.query.soldiers.findFirst({ where: eq(soldiers.phone, phone) })
    if (!soldier) throw new NotFoundException('Phone not registered')

    if (DEV_PHONES.includes(phone)) {
      console.log(`[DEV] OTP for ${phone}: ${DEV_OTP}`)
      return { ok: true }
    }

    // TODO: Send via Twilio
    return { ok: true }
  }

  async verifyOtp(phone: string, code: string): Promise<{ accessToken: string; refreshToken: string }> {
    const soldier = await db.query.soldiers.findFirst({ where: eq(soldiers.phone, phone) })
    if (!soldier) throw new UnauthorizedException()

    const isValid = DEV_PHONES.includes(phone) ? code === DEV_OTP : false // TODO: Redis OTP check
    if (!isValid) throw new UnauthorizedException('Invalid OTP')

    const payload = { sub: soldier.id, company_id: soldier.companyId, role: soldier.role }
    const accessToken = this.jwt.sign(payload)
    const refreshToken = this.jwt.sign(payload, { expiresIn: '30d' })

    return { accessToken, refreshToken }
  }
}
