import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose'
import mongoose, { HydratedDocument, ObjectId } from 'mongoose'
import { Transform } from 'class-transformer'

export type UserServerDocument = HydratedDocument<UserServer>
@Schema({ toJSON: { virtuals: true }, timestamps: true })
export class UserServer {
  @Transform(({ value }) => value.toString())
  _id: ObjectId

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'users' })
  userId: string

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'servers' })
  serverId: string
}

export const UserServerSchema = SchemaFactory.createForClass(UserServer)
