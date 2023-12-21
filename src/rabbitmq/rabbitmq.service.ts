import { Global, Injectable } from '@nestjs/common'
import amqplib from 'amqplib/callback_api'

@Global()
@Injectable()
export default class RabbitMQService {
  private _amqp: typeof amqplib = amqplib
  private _channel: amqplib.Channel

  constructor() {}

  connect(callback: (connection: amqplib.Connection, channel: amqplib.Channel, error: any) => void) {
    this._amqp.connect('amqp://localhost', (connectError: any, connection: amqplib.Connection) => {
      if (connectError) {
        callback(connectError, null, null)
        throw connectError
      } else {
        connection.createChannel((createChannelError: any, channel: amqplib.Channel) => {
          if (createChannelError) {
            callback(connection, channel, createChannelError)
          } else {
            this._channel = channel
            callback(connection, channel, null)
          }
        })
      }
    })
  }

  get channel(): amqplib.Channel {
    return this._channel
  }
}
