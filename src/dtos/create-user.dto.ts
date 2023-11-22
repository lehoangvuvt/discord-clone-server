import { Transform, TransformFnParams } from 'class-transformer'
import { IsNotEmpty, MinLength, NotContains } from 'class-validator'

export default class CreateUserDTO {
  @IsNotEmpty()
  @NotContains(' ')
  username: string

  @IsNotEmpty()
  @MinLength(5)
  password: string

  name: string
}
