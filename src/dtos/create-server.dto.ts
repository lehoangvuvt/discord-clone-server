import { IsNotEmpty } from 'class-validator'
import { ObjectId } from 'mongoose'

export default class CreateServerDTO {
  @IsNotEmpty()
  name: string

  @IsNotEmpty()
  creator: ObjectId
}
