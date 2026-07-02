import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateScoreDto {
  @IsUUID()
  bidId!: string;

  @IsUUID()
  criteriaId!: string;

  @IsNumber()
  @Min(0)
  score!: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
