import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument, ObjectId } from 'mongoose'
import { Transform } from 'class-transformer'
import { UploadedFile } from './uploaded-file'

export type AttachmentDocument = HydratedDocument<Attachment>
@Schema({ toJSON: { virtuals: true }, timestamps: true })
export class Attachment {
  @Transform(({ value }) => value.toString())
  _id: ObjectId

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'uploadedfiles' })
  fileId: ObjectId
}

export const AttachmentSchema = SchemaFactory.createForClass(Attachment)

AttachmentSchema.virtual('fileDetails', {
  ref: UploadedFile.name,
  localField: 'fileId',
  foreignField: '_id',
  justOne: true,
})
