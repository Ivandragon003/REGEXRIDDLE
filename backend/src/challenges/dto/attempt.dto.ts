import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class AttemptDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  regex: string;
}
