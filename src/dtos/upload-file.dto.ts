import { IsNotEmpty } from 'class-validator'

export default class UploadFileDTO {
  @IsNotEmpty()
  name: string

  @IsNotEmpty()
  type: string

  @IsNotEmpty()
  base64: string

  @IsNotEmpty()
  section: string
}
