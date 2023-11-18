import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose'
import mongoose, { HydratedDocument, ObjectId } from 'mongoose'
import { Transform, Type } from 'class-transformer'
import { User } from './user.schema'
import { Channel } from './channel.schema'
import { Attachment } from './attachment.schema'

export type MessageHistoryDocument = HydratedDocument<MessageHistory>
@Schema({ toJSON: { virtuals: true }, timestamps: true })
export class MessageHistory {
  @Transform(({ value }) => value.toString())
  _id: ObjectId

  @Prop({ required: true })
  message: string

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'users' })
  @Type(() => User)
  userId: ObjectId

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'channels' })
  @Type(() => Channel)
  channelId: ObjectId
}

export const MessageHistorySchema = SchemaFactory.createForClass(MessageHistory)

MessageHistorySchema.virtual('userDetails', {
  ref: User.name,
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
})

MessageHistorySchema.virtual('attachments', {
  ref: Attachment.name,
  localField: '_id',
  foreignField: 'messageId',
  justOne: false,
})
