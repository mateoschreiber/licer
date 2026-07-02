import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateQuestionDto {
  @IsUUID()
  tenderId!: string;

  @IsString()
  @MinLength(5)
  text!: string;
}
