import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose'
import mongoose, { HydratedDocument, ObjectId } from 'mongoose'
import { Transform, Type } from 'class-transformer'
import { Server } from './server.schema'
import { nanoid } from 'nanoid'

export type ServerInvitationDocument = HydratedDocument<ServerInvitation>
@Schema({ toJSON: { virtuals: true }, timestamps: true })
export class ServerInvitation {
  @Transform(({ value }) => value.toString())
  _id: ObjectId

  @Prop({ unique: true })
  invitation_short_id: string

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'servers' })
  @Type(() => Server)
  serverId: ObjectId

  @Prop({ required: true, type: Date })
  expiredAt: Date

  @Prop({ default: -1, type: mongoose.Schema.Types.Number })
  limit: number

  @Prop({ default: 0, type: mongoose.Schema.Types.Number })
  used_count: number
}

export const ServerInvitationSchema = SchemaFactory.createForClass(ServerInvitation)

ServerInvitationSchema.pre('save', function (next) {
  this.invitation_short_id = nanoid()
  next()
})
