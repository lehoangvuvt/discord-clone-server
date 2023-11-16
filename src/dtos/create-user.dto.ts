import { IsNotEmpty, MinLength } from 'class-validator'

export default class CreateUserDTO {
  @IsNotEmpty()
  username: string

  @IsNotEmpty()
  @MinLength(5)
  password: string

  name: string
}
