import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { RequestingAreaStatus } from '@prisma/client';

export class CreateRequestingAreaDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(RequestingAreaStatus)
  status?: RequestingAreaStatus;
}
