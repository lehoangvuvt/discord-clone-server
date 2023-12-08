import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose'
import mongoose, { HydratedDocument, ObjectId } from 'mongoose'
import { Transform } from 'class-transformer'

export enum ActivityVerbEnum {
  ADD_FRIEND = 'ADD_FRIEND',
  INVITE_TO_SERVER = 'INVITE_TO_SERVER',
  MENTION = 'MENTION',
  NEW_MESSAGE_P2P = 'NEW_MESSAGE_P2P',
  NEW_MESSAGE_CHANNEL = 'NEW_MESSAGE_CHANNEL',
}

export type ActivityDocument = HydratedDocument<Activity>
@Schema({ toJSON: { virtuals: true }, timestamps: true })
export class Activity {
  @Transform(({ value }) => value.toString())
  _id: ObjectId

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  actor_id: ObjectId

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'users' })
  object_id: ObjectId

  @Prop({ type: mongoose.Schema.Types.String, enum: ActivityVerbEnum, required: true })
  verb: ActivityVerbEnum

  @Prop({ type: mongoose.Schema.Types.Boolean, default: false })
  isRead: boolean
}

export const ActivitySchema = SchemaFactory.createForClass(Activity)
