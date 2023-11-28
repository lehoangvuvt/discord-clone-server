import { IsNotEmpty, IsString } from 'class-validator'
import { ObjectId } from 'mongoose'

export default class CreateServerDTO {
  @IsNotEmpty()
  name: string

  avatar: string
}
