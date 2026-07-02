import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTenderDto {
  @IsString()
  code!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  requesterArea?: string;

  @IsOptional()
  @IsBoolean()
  allowBidReplacement?: boolean;

  @IsOptional()
  @IsDateString()
  questionDeadline?: string;

  @IsDateString()
  bidDeadline!: string;

  @IsOptional()
  @IsDateString()
  evaluationStart?: string;

  @IsOptional()
  @IsDateString()
  estimatedAwardAt?: string;
}
