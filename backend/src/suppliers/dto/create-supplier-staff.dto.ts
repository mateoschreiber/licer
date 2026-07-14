import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSupplierStaffDto {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  phoneCountry?: string;

  @IsOptional()
  @IsString()
  title?: string;
}
