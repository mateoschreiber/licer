import { IsArray, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { SupplierStatus } from '@prisma/client';

export class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @IsString()
  tradeName?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsEnum(SupplierStatus)
  status?: SupplierStatus;
}
