import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, ObjectId } from 'mongoose'
import { Transform } from 'class-transformer'

export type UploadedFileDocument = HydratedDocument<UploadedFile>
@Schema({ toJSON: { virtuals: true }, timestamps: true })
export class UploadedFile {
  @Transform(({ value }) => value.toString())
  _id: ObjectId

  @Prop({ required: true })
  name: string

  @Prop({ required: true })
  path: string

  @Prop()
  type: string

  @Prop()
  section: string
}

export const UploadedFileSchema = SchemaFactory.createForClass(UploadedFile)
