import { IsNotEmpty } from 'class-validator'
import { ObjectId } from 'mongoose'

export default class CreateAttachmentDTO {
  @IsNotEmpty()
  name: string

  @IsNotEmpty()
  buffer: Buffer

  @IsNotEmpty()
  type: string
}

export type ICreateAttachment = {
  name: string
  buffer: Buffer
  type: string
}
