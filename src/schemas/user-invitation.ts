import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose'
import mongoose, { HydratedDocument, ObjectId } from 'mongoose'
import { Transform, Type } from 'class-transformer'
import { User } from './user.schema'
import { ServerInvitation } from './server-invitation'

export type UserInvitationDocument = HydratedDocument<UserInvitation>
@Schema({ toJSON: { virtuals: true }, timestamps: true })
export class UserInvitation {
  @Transform(({ value }) => value.toString())
  _id: ObjectId

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'serverinvitations' })
  @Type(() => ServerInvitation)
  invitationId: ObjectId

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'users' })
  @Type(() => User)
  userId: ObjectId

  @Prop({ required: true })
  invitation_short_id: string
}

export const UserInvitationSchema = SchemaFactory.createForClass(UserInvitation)
