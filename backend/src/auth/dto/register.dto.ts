import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'lo username può contenere solo lettere, numeri, trattini e underscore',
  })
  username: string;

  @IsEmail({}, { message: 'email non valida' })
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;
}
