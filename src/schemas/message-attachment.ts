import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument, ObjectId } from 'mongoose'
import { Transform } from 'class-transformer'

export type MessageAttachmentDocument = HydratedDocument<MessageAttachment>
@Schema({ toJSON: { virtuals: true }, timestamps: true })
export class MessageAttachment {
  @Transform(({ value }) => value.toString())
  _id: ObjectId

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'messagehistories' })
  messageId: string

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'attachments' })
  attachmentId: string
}

export const MessageAttachmentSchema = SchemaFactory.createForClass(MessageAttachment)
