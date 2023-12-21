import { IsNotEmpty, IsNumber, IsString } from 'class-validator'

export default class SendMailDTO {
  @IsNotEmpty()
  @IsString()
  to: string

  @IsNotEmpty()
  @IsNumber()
  code?: number

  @IsNotEmpty()
  @IsString() 
  url?: string

  type: 'VERIFY' | 'RESET_PASSWORD'
}
