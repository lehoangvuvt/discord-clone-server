import mongoose, { Model, ObjectId } from 'mongoose'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import CreateAttachmentDTO from 'src/dtos/create-attachment.dto'
import { Attachment } from 'src/schemas/attachment.schema'

@Injectable()
export class AttachmentService {
  constructor(@InjectModel(Attachment.name) private attachmentModel: Model<Attachment>) {}

  async createAttachment(createAttachmentDTO: CreateAttachmentDTO): Promise<Attachment> {
    const { fileId } = createAttachmentDTO
    const attachmentModel = new this.attachmentModel({
      fileId: new mongoose.Types.ObjectId(fileId),
    })
    const result = await attachmentModel.save()
    return result
  }

  async getAllAttachments(): Promise<Array<Attachment>> {
    const result = await this.attachmentModel.find().lean()
    return result
  }

  async getAttachment(_id: string): Promise<Attachment> {
    const objectId = new mongoose.Types.ObjectId(_id)
    const result = await this.attachmentModel.find({ _id: objectId }).populate('fileDetails').lean()
    if (result?.length > 0) {
      return result[0]
    } else {
      return null
    }
  }
}
