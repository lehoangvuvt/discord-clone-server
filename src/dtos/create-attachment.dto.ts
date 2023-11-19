import { IsNotEmpty } from 'class-validator'

export default class CreateAttachmentDTO {
  @IsNotEmpty()
  fileId: string
}

export type ICreateAttachment = {
  fileId: string
}
