import { EvaluationCategory } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateCriteriaDto {
  @IsUUID()
  tenderId!: string;

  @IsEnum(EvaluationCategory)
  category!: EvaluationCategory;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  weight!: number;

  @IsNumber()
  @Min(0)
  maxScore!: number;
}
