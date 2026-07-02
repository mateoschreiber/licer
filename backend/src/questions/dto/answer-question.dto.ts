import { IsString, MinLength } from 'class-validator';

export class AnswerQuestionDto {
  @IsString()
  @MinLength(5)
  text!: string;
}
