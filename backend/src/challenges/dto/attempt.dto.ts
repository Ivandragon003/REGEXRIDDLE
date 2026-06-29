import { IsString, IsNotEmpty } from 'class-validator';

export class AttemptDto {
  @IsString()
  @IsNotEmpty()
  regex: string;
}
