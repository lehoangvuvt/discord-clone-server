import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument, ObjectId, Types } from 'mongoose'
import { Transform } from 'class-transformer'
import { Server } from './server.schema'
import { UserServer } from './user-server.schema'

export type UserDocument = HydratedDocument<User>
@Schema({ toJSON: { virtuals: true }, timestamps: true })
export class User {
  @Transform(({ value }) => value.toString())
  _id: ObjectId

  @Prop({ unique: true, required: true, minlength: 4 })
  username: string

  @Prop({ required: true, minlength: 4 })
  password: string

  @Prop({ default: '' })
  name: string

  @Prop({ default: 'https://png.pngtree.com/png-clipart/20220112/ourmid/pngtree-cartoon-hand-drawn-default-avatar-png-image_4154232.png' })
  avatar: string
}

export const UserSchema = SchemaFactory.createForClass(User)

UserSchema.virtual('createdServers', {
  ref: 'servers',
  localField: '_id',
  foreignField: 'creator',
  justOne: false,
})

UserSchema.virtual('joinedServers', {
  ref: 'userservers',
  localField: '_id',
  foreignField: 'userId',
  justOne: false,
})
