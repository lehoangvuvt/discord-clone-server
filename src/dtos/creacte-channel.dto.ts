import { IsEmail, IsNotEmpty, MinLength } from 'class-validator'
import { ObjectId } from 'mongoose'

export default class CreateChannelDTO {
  @IsNotEmpty()
  name: string

  @IsNotEmpty()
  serverId: ObjectId
}
