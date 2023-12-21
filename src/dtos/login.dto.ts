import { IsNotEmpty, MinLength, NotContains } from 'class-validator'

export default class LoginDTO {
  @IsNotEmpty()
  @NotContains(' ')
  @MinLength(5)
  username: string

  @IsNotEmpty()
  @MinLength(5)
  password: string
}
