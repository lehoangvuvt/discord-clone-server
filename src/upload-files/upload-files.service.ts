import mongoose, { Model } from 'mongoose'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { writeFile } from 'mz/fs'
import { UploadedFile } from 'src/schemas/uploaded-file'
import UploadFileDTO from 'src/dtos/upload-file.dto'
import { join } from 'path'
import { v2 as cloudinary } from 'cloudinary'

@Injectable()
export class UploadedFilesService {
  constructor(@InjectModel(UploadedFile.name) private uploadedFileModel: Model<UploadedFile>) {}

  async uploadFile(uploadFileDTO: UploadFileDTO): Promise<UploadedFile> {
    const { name, type, base64, section } = uploadFileDTO
    const base64Data = base64.replace(type, '')
    const path = join(__dirname, '../..', 'public/uploaded-files')
    let subPath = ''
    if (type.includes('image')) {
      subPath = 'images'
    } else if (type.includes('audio')) {
      subPath = 'audio'
    } else if (type.includes('video')) {
      subPath = 'videos'
    } else {
      subPath = 'others'
    }
    subPath += `/${section}`
    try {
      await writeFile(`${path}/${subPath}/${name}`, base64Data, 'base64')
      console.log(`${path}/${subPath}/${name}`)
      const attachmentModel = new this.uploadedFileModel({
        name,
        type,
        section,
        path: `${subPath}/${name}`,
      })
      const result = await attachmentModel.save()
      return result
    } catch (error) {
      console.log('Error at upload file: ' + error)
      return null
    }
  }

  async getAllFiles(): Promise<UploadedFile[]> {
    const result = await this.uploadedFileModel.find().lean()
    return result
  }

  async getFile(_id: string): Promise<UploadedFile> {
    const objectId = new mongoose.Types.ObjectId(_id)
    const result = await this.uploadedFileModel.findOne({ _id: objectId }).lean()
    if (result) {
      return result
    } else {
      return null
    }
  }

  async uploadToCloudinary(uploadFileDTO: UploadFileDTO): Promise<UploadedFile> {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_KEY,
      api_secret: process.env.CLOUDINARY_SECRET,
    })
    const { base64, name, section, type } = uploadFileDTO
    const formattedName = name.replace(' ', '_').split('.')[0]
    let resourceType: 'image' | 'video' | 'auto' | 'raw' = 'raw'
    let subPath = ''
    if (type.includes('image')) {
      subPath = 'images'
      resourceType = 'image'
    } else if (type.includes('audio')) {
      subPath = 'audio'
      resourceType = 'video'
    } else if (type.includes('video')) {
      subPath = 'videos'
      resourceType = 'video'
    } else {
      subPath = 'others'
      resourceType = 'raw'
    }
    subPath += `/${section}`
    try {
      const responseUpload = await cloudinary.uploader.upload(base64, { public_id: formattedName, folder: subPath, resource_type: resourceType })
      const attachmentModel = new this.uploadedFileModel({
        name,
        type,
        section,
        path: responseUpload.secure_url,
      })
      const result = await attachmentModel.save()
      return result
    } catch (error) {
      return null
    }
  }
}
