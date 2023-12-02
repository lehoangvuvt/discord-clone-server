import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Transform } from 'class-transformer'
import mongoose, { HydratedDocument, ObjectId } from 'mongoose'

export enum RelationshipTypeEnum {
  FRIEND = 'FRIEND',
  PENDING_REQUEST = 'PENDING_REQUEST',
  BLOCK_FIRST_SECOND = 'BLOCK_FIRST_SECOND',
  BLOCK_SECOND_FIRST = 'BLOCK_SECOND_FIRST',
  DECLINE = 'DECLINE',
}

export type UserRelationshipDocument = HydratedDocument<UserRelationship>
@Schema({ toJSON: { virtuals: true }, timestamps: true })
export class UserRelationship {
  @Transform(({ value }) => value.toString())
  _id: string

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'users', index: true })
  userFirstId: ObjectId

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'users', index: true })
  userSecondId: ObjectId

  @Prop({ type: mongoose.Schema.Types.String, enum: RelationshipTypeEnum, default: RelationshipTypeEnum.PENDING_REQUEST })
  type: string
}

export const UserRelationshipSchema = SchemaFactory.createForClass(UserRelationship)
UserRelationshipSchema.index(
  {
    'userFirstId': 1,
    'userSecondId': 1,
  },
  {
    unique: true,
  }
)
