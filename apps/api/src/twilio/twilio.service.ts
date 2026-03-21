import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common'
import twilio from 'twilio'

const DEV_PHONES = ['+972500000001', '+972500000002', '+972500000003']
const DEV_OTP = '123456'

@Injectable()
export class TwilioService {
  private client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  private serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID!

  async sendOtp(phone: string): Promise<void> {
    if (DEV_PHONES.includes(phone)) {
      console.log(`[DEV] OTP requested for ${phone}, use ${DEV_OTP}`)
      return
    }
    try {
      await this.client.verify.v2.services(this.serviceSid).verifications.create({ to: phone, channel: 'sms' })
    } catch {
      throw new InternalServerErrorException('Failed to send OTP')
    }
  }

  async checkOtp(phone: string, code: string): Promise<boolean> {
    if (DEV_PHONES.includes(phone)) {
      return code === DEV_OTP
    }
    try {
      const result = await this.client.verify.v2
        .services(this.serviceSid)
        .verificationChecks.create({ to: phone, code })
      return result.status === 'approved'
    } catch {
      throw new UnauthorizedException('Invalid OTP')
    }
  }
}
