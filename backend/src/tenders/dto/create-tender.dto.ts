import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateTenderDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsUUID()
  requestingAreaId?: string;

  @IsOptional()
  @IsString()
  requesterArea?: string;

  @IsOptional()
  @IsBoolean()
  allowBidReplacement?: boolean;

  @IsOptional()
  @IsDateString()
  questionDeadline?: string;

  @IsOptional()
  @IsDateString()
  bidDeadline?: string;

  @IsOptional()
  @IsDateString()
  evaluationStart?: string;

  @IsOptional()
  @IsDateString()
  estimatedAwardAt?: string;
}
