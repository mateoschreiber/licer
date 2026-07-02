import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { RequestingAreaStatus } from '@prisma/client';

export class UpdateRequestingAreaDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(RequestingAreaStatus)
  status?: RequestingAreaStatus;
}
