import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose'
import mongoose, { HydratedDocument, ObjectId } from 'mongoose'
import { Transform } from 'class-transformer'

enum ActivityVerbEnum {
  ADD_FRIEND = 'ADD_FRIEND',
  INVITE_TO_SERVER = 'INVITE_TO_SERVER',
  MENTION = 'MENTION',
}

export type ActivityDocument = HydratedDocument<Activity>
@Schema({ toJSON: { virtuals: true }, timestamps: true })
export class Activity {
  @Transform(({ value }) => value.toString())
  _id: ObjectId

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'users' })
  actor: ObjectId

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'users' })
  object: ObjectId

  @Prop({ type: mongoose.Schema.Types.String, enum: ActivityVerbEnum, required: true })
  verb: string

  @Prop({ type: mongoose.Schema.Types.Boolean, default: false })
  isRead: boolean
}

export const ActivitySchema = SchemaFactory.createForClass(Activity)
