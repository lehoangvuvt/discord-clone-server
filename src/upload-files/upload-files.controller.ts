import { Controller, Get, Post, Body, Res, Param } from '@nestjs/common'
import { Response } from 'express'
import { JwtService } from '@nestjs/jwt'
import { createReadStream, statSync } from 'fs'
import { UploadedFilesService } from './upload-files.service'
import UploadFileDTO from 'src/dtos/upload-file.dto'

@Controller('files')
export class UploadedFilesController {
  constructor(private readonly service: UploadedFilesService, private jwtService: JwtService) {}

  @Post('upload')
  async upload(@Body() uploadFileDTO: UploadFileDTO, @Res() res: Response) {
    const response = await this.service.uploadToCloudinary(uploadFileDTO)
    if (response) {
      return res.status(200).json(response)
    } else {
      return res.status(401).send({ error: 'Error at upload file: ' + uploadFileDTO.name })
    }
  }

  @Get('get-all')
  async getAll(@Res() res: Response) {
    const response = await this.service.getAllFiles()
    if (response) {
      return res.status(200).json(response)
    } else {
      return res.status(404).json({ error: 'Cannot get all files' })
    }
  }

  // @Get(':type/:section/:fileName')
  // async getFile(@Param() param: { type: string; fileName: string; section: string }, @Res() res: Response) {
  //   const path = `src/uploaded-files/${param.type}/${param.section}/${param.fileName}`
  //   const stat = statSync(path)
  //   const readStream = createReadStream(path)
  //   let fileNameExtension = ''
  //   switch (param.fileName.split('.')[1]) {
  //     case 'mp3':
  //       fileNameExtension = 'mpeg'
  //       break
  //     case 'jpg':
  //       fileNameExtension = 'jpeg'
  //     default:
  //       fileNameExtension = param.fileName.split('.')[1]
  //   }
  //   const fileType = param.type === 'images' ? 'image' : param.type
  //   const contentType = fileType + '/' + fileNameExtension
  //   res.writeHead(200, {
  //     'Content-Type': contentType,
  //     'Content-Length': stat.size,
  //     'Accept-Ranges': 'bytes',
  //     'Content-Disposition': 'attachment; filename=' + param.fileName,
  //   })
  //   readStream.on('open', function () {
  //     readStream.pipe(res)
  //   })

  //   readStream.on('error', function (err) {
  //     res.end(err)
  //   })
  // }
}
