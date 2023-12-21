import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument, ObjectId } from 'mongoose'
import { nanoid } from 'nanoid'
import { Transform } from 'class-transformer'

export type PendingRegisterDocument = HydratedDocument<PendingRegister>
@Schema({ toJSON: { virtuals: true }, timestamps: true })
export class PendingRegister {
  @Transform(({ value }) => value.toString())
  _id: ObjectId

  @Prop({ required: true, minlength: 4 })
  username: string

  @Prop({ required: true, minlength: 4 })
  password: string

  @Prop({ default: '' })
  name: string

  @Prop({ default: '', required: true, type: mongoose.Schema.Types.String })
  email: string

  @Prop({ unique: true, type: mongoose.Schema.Types.String })
  url: string
}

export const PendingRegisterSchema = SchemaFactory.createForClass(PendingRegister)
PendingRegisterSchema.pre('save', function (next) {
  this.url = nanoid()
  next()
})
