import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose'
import mongoose, { HydratedDocument, ObjectId } from 'mongoose'
import { Transform, Type } from 'class-transformer'
import { Server } from './server.schema'

export type ChannelDocument = HydratedDocument<Channel>
@Schema({ toJSON: { virtuals: true }, timestamps: true })
export class Channel {
  @Transform(({ value }) => value.toString())
  _id: ObjectId

  @Prop({ required: true })
  name: string

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'servers' })
  @Type(() => Server) 
  serverId: ObjectId
}

export const ChannelSchema = SchemaFactory.createForClass(Channel)
