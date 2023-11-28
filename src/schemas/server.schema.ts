import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose'
import mongoose, { HydratedDocument, ObjectId } from 'mongoose'
import { Transform } from 'class-transformer'

export type ServerDocument = HydratedDocument<Server>
@Schema({ toJSON: { virtuals: true }, timestamps: true })
export class Server {
  @Transform(({ value }) => value.toString())
  _id: ObjectId

  @Prop({ required: true })
  name: string  

  @Prop({ default: '' })
  avatar: string

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'users' })
  creator: ObjectId
}

export const ServerSchema = SchemaFactory.createForClass(Server)

ServerSchema.virtual('serverChannels', {
  ref: 'channels',
  localField: '_id',
  foreignField: 'serverId',
  justOne: false,
})
