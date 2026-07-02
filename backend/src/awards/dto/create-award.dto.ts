import { IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateAwardDto {
  @IsUUID()
  tenderId!: string;

  @IsUUID()
  supplierId!: string;

  @IsOptional()
  @IsUUID()
  bidId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsString()
  @MinLength(5)
  reason!: string;
}
