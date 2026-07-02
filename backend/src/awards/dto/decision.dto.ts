import { IsString, IsUUID, MinLength } from 'class-validator';

export class DecisionDto {
  @IsUUID()
  tenderId!: string;

  @IsString()
  @MinLength(5)
  reason!: string;
}
