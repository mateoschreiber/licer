import { IsOptional, IsString } from 'class-validator';

export class SupplierActionDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
