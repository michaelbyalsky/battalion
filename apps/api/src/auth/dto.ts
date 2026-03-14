import { IsString, IsPhoneNumber, Length } from 'class-validator'

export class RequestOtpDto {
  @IsPhoneNumber()
  phone!: string
}

export class VerifyOtpDto {
  @IsPhoneNumber()
  phone!: string

  @IsString()
  @Length(6, 6)
  code!: string
}
