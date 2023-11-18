import { Model, ObjectId } from 'mongoose'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import CreateAttachmentDTO from 'src/dtos/create-attachment.dto'
import { Attachment } from 'src/schemas/attachment.schema'

@Injectable()
export class AttachmentService {
  constructor(@InjectModel(Attachment.name) private attachmentModel: Model<Attachment>) {}

  async createAttachment(createAttachmentDTO: CreateAttachmentDTO): Promise<Attachment> {
    const { buffer, name, type } = createAttachmentDTO
    const attachmentModel = new this.attachmentModel({
      buffer,
      name,
      type,
    })
    const result = await attachmentModel.save()
    return result
  }

  async getAllAttachments(): Promise<Array<Attachment>> {
    const result = await this.attachmentModel.find().lean()
    return result
  }

  async getAttachment(_id: ObjectId): Promise<Attachment> {
    const result = await this.attachmentModel.findOne({ _id }).lean()
    return result
  }
}
