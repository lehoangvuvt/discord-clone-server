import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { JwtModule } from '@nestjs/jwt'
import { Attachment, AttachmentSchema } from 'src/schemas/attachment.schema'
import { AttachmentController } from './attachment.controller'
import { AttachmentService } from './attachment.service'

@Module({
  imports: [MongooseModule.forFeature([{ name: Attachment.name, schema: AttachmentSchema }]), JwtModule.register({})],
  controllers: [AttachmentController],
  providers: [AttachmentService],
  exports: [AttachmentService],
})
export class AttachmentModule {}
