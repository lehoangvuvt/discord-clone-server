import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose'
import mongoose, { HydratedDocument, ObjectId } from 'mongoose'
import { Transform, Type } from 'class-transformer'
import { nanoid } from 'nanoid'
import { User } from './user.schema'

export type ResetPasswordRequestDocument = HydratedDocument<ResetPasswordRequest>
@Schema({ toJSON: { virtuals: true }, timestamps: true })
export class ResetPasswordRequest {
  @Transform(({ value }) => value.toString())
  _id: ObjectId

  @Prop({ unique: true, index: 1 })
  request_id: string

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'users' })
  @Type(() => User)
  userId: ObjectId

  @Prop({ required: true, type: Date })
  expiredAt: Date
}

export const ResetPasswordRequestSchema = SchemaFactory.createForClass(ResetPasswordRequest)
ResetPasswordRequestSchema.pre('save', function (next) {
  this.request_id = nanoid()
  next()
})
