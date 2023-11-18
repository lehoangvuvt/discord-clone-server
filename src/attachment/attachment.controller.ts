import { Controller, Get, Post, Body, Res, Param } from '@nestjs/common'
import { Response } from 'express'
import { JwtService } from '@nestjs/jwt'
import { AttachmentService } from './attachment.service'
import CreateAttachmentDTO from 'src/dtos/create-attachment.dto'
import { ObjectId } from 'mongoose'

@Controller('attachments')
export class AttachmentController {
  constructor(private readonly service: AttachmentService, private jwtService: JwtService) {}

  @Post('upload')
  async upload(@Body() createAttachmentDTO: CreateAttachmentDTO, @Res() res: Response) {
    const response = await this.service.createAttachment(createAttachmentDTO)
    if (response) {
      return res.status(200).json(response)
    } else {
      return res.status(401).send({ error: 'Error at create attachment.' })
    }
  }

  @Get(':attachmentId')
  async getAll(@Param() param: { attachmentId: ObjectId }, @Res() res: Response) {
    const response = await this.service.getAttachment(param.attachmentId)
    if (response) {
      return res.status(200).json(response)
    } else {
      return res.status(404).json({ error: 'Cannot find attachment' })
    }
  }
}
