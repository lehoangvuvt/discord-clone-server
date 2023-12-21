import { Transform, TransformFnParams } from 'class-transformer'
import { IsEmail, IsNotEmpty, MinLength, NotContains } from 'class-validator'

export default class CreateUserDTO {
  @IsNotEmpty()
  @NotContains(' ')
  @MinLength(5)
  username: string

  @IsNotEmpty()
  @MinLength(5)
  password: string

  @IsNotEmpty()
  @IsEmail()
  email: string

  name: string
}
