import { Body, Controller, Post, Res } from '@nestjs/common'
import MailService from './mail.service'
import { SUCCESS } from 'src/consts/httpCodes'
import { Response } from 'express'
import { SendMailData } from 'src/types/api.types'

@Controller('mail')
export class MailController {
  constructor(private readonly service: MailService) {}

  @Post('send')
  async send(@Body() sendMailData: SendMailData, @Res() res: Response) {
    const response = this.service.addToQueue(sendMailData)
    return res.status(SUCCESS).json('send to queue')
  }
}
