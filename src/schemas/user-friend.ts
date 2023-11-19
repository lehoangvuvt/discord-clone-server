import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, ObjectId } from 'mongoose'
import { Transform } from 'class-transformer'

export type AttachmentDocument = HydratedDocument<Attachment>
@Schema({ toJSON: { virtuals: true }, timestamps: true })
export class Attachment {
  @Transform(({ value }) => value.toString())
  _id: ObjectId

  @Prop({ required: true })
  name: string

  @Prop({ required: true })
  buffer: Buffer

  @Prop()
  type: string
}

export const AttachmentSchema = SchemaFactory.createForClass(Attachment)
