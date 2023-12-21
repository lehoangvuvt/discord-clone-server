import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose'
import mongoose, { HydratedDocument, ObjectId } from 'mongoose'
import { Transform, Type } from 'class-transformer'
import { PendingRegister } from './pending-register.schema'

export type PendingRegisterOTPDocument = HydratedDocument<PendingRegisterOTP>
@Schema({ toJSON: { virtuals: true }, timestamps: true })
export class PendingRegisterOTP {
  @Transform(({ value }) => value.toString())
  _id: ObjectId

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'pendingregisters', index: true })
  @Type(() => PendingRegister)
  pending_register_id: ObjectId

  @Prop({ type: mongoose.Schema.Types.Number })
  code: number

  @Prop({ required: true, type: Date })
  expiredAt: Date

  @Prop({ required: true, type: mongoose.Schema.Types.Boolean, default: true })
  valid: boolean
}

export const PendingRegisterOTPSchema = SchemaFactory.createForClass(PendingRegisterOTP)
