import { User } from 'src/schemas/user.schema'

export enum VerifyErrorTypeEnum {
  EXPIRED = 'EXPIRED',
  INVALID_OTP = 'INVALID_OTP',
  INVALID_URL = 'INVALID_URL',
}

export type VerifyOTPRes =
  | {
      status: 'Success'
      data: User
    }
  | {
      status: 'Error'
      errorType: VerifyErrorTypeEnum
    }

export enum RequestResetPasswordErrorEnum {
  WRONG_EMAIL = 'WRONG_EMAIL',
}

export type RequestResetPasswordRes = { status: 'Success' } | { status: 'Error'; errorType: RequestResetPasswordErrorEnum }

export type SendMailData =
  | {
      type: 'VERIFY'
      to: string
      code: number
      url: string
    }
  | {
      type: 'RESET_PASSWORD'
      to: string
      requestId: string
      username: string
    }
