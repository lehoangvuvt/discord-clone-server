import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { JwtModule } from '@nestjs/jwt'
import { UploadedFile, UploadedFileSchema } from 'src/schemas/uploaded-file'
import { UploadedFilesService } from './upload-files.service'
import { UploadedFilesController } from './upload-files.controller'

@Module({
  imports: [MongooseModule.forFeature([{ name: UploadedFile.name, schema: UploadedFileSchema }]), JwtModule.register({})],
  controllers: [UploadedFilesController],
  providers: [UploadedFilesService],
  exports: [UploadedFilesService],
})
export class UploadedFilesModule {}
