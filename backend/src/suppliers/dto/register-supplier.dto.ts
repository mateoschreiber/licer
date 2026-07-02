import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterSupplierDto {
  @IsString()
  ruc!: string;

  @IsString()
  legalName!: string;

  @IsOptional()
  @IsString()
  tradeName?: string;

  @IsString()
  contactName!: string;

  @IsEmail()
  contactEmail!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsArray()
  @IsString({ each: true })
  categories: string[] = [];

  @IsString()
  @MinLength(8)
  password!: string;
}
