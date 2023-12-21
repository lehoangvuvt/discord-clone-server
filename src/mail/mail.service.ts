import { Injectable, Global, Inject } from '@nestjs/common'
import nodemailer from 'nodemailer'
import amqplib from 'amqplib/callback_api'
import RabbitMQService from 'src/rabbitmq/rabbitmq.service'
import { SendMailData } from 'src/types/api.types'
import { RedisService } from 'src/redis/redis.service'
@Global()
@Injectable()
export default class MailService {
  constructor(@Inject(RabbitMQService) private rabbitMQService: RabbitMQService, @Inject(RedisService) private redisService: RedisService) {
    if (process.env.ENVIRONMENT === 'DEV') {
      this.rabbitMQService.connect((connection: amqplib.Connection, channel: amqplib.Channel, error: any) => {
        if (error) throw error
        channel.assertQueue('task_send_mail', { durable: true })
        channel.consume('task_send_mail', (msg) => this.handleSendMail(msg.content.toString()), {
          noAck: true,
        })
      })
    } else {
      this.redisService.subscribe(['task_send_mail'])
      this.redisService.on((channel, data) => {
        switch (channel) {
          case 'task_send_mail':
            this.handleSendMail(data)
            break
        }
      })
    }
  }

  async handleSendMail(msg: string) {
    const transporter = nodemailer.createTransport({
      service: 'Mail.ru',
      auth: {
        user: 'lehoangvuvt@mail.ru',
        pass: 'NznAvTyRaQTSckDaL5uH',
      },
    })

    const sendMailData: SendMailData = JSON.parse(msg)
    let html = ''
    switch (sendMailData.type) {
      case 'VERIFY':
        html = `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
        <div style="margin:20px auto;width:100%;padding:20px 0">
          <div style="border-bottom:1px solid #eee">
            <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Interesting Chat</a>
          </div>
          <p style="font-size:1.1em">Hi,</p>
          <p>Thank you for choosing Interesting Chat. Use the following OTP and this link to complete your Sign Up procedures. OTP is valid for 1 hour</p>
          <p>Link: ${process.env.CLIENT_HOST_URL}/verify/${sendMailData.url}</p>
          <p>OTP code: ${sendMailData.code}</p>
          <p style="font-size:0.9em;">Regards,<br />Interesting Chat</p>
          <hr style="border:none;border-top:1px solid #eee" />
          <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
            <p>Interesting Chat Inc</p>
            <p>360G Ben Van Don Street</p>
            <p>Ho Chi Minh City, Vietnam</p>
          </div>
        </div>
      </div>`
        break
      case 'RESET_PASSWORD':
        html = `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
        <div style="margin:20px auto;width:100%;padding:20px 0">
          <div style="border-bottom:1px solid #eee">
            <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Interesting Chat</a>
          </div>
          <p style="font-size:1.1em">Hi,</p>
          <p>You this link to reset your password with your username ${sendMailData.username}</p>
          <p>Link: ${process.env.CLIENT_HOST_URL}/reset-password/${sendMailData.requestId}</p>
          <p style="font-size:0.9em;">Regards,<br />Interesting Chat</p>
          <hr style="border:none;border-top:1px solid #eee" />
          <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
            <p>Interesting Chat Inc</p>
            <p>360G Ben Van Don Street</p>
            <p>Ho Chi Minh City, Vietnam</p>
          </div>
        </div>
      </div>`
        break
    }

    const response = await transporter.sendMail({
      from: 'lehoangvuvt@mail.ru',
      to: sendMailData.to,
      subject: 'Verify account',
      html,
    })
    console.log('handleSendMail success')
  }

  async addToQueue(sendMailData: SendMailData) {
    this.rabbitMQService.channel.sendToQueue('task_send_mail', Buffer.from(JSON.stringify(sendMailData)), {
      persistent: true,
    })
  }
}
