import { IsArray, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { SupplierStatus } from '@prisma/client';

export class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  ruc?: string;

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
  @IsEmail()
  billingEmail?: string;

  @IsOptional()
  @IsString()
  billingAddress?: string;

  @IsOptional()
  @IsString()
  legalRepresentative?: string;

  @IsOptional()
  @IsString()
  legalRepresentativeFirstName?: string;

  @IsOptional()
  @IsString()
  legalRepresentativeLastName?: string;

  @IsOptional()
  @IsString()
  legalRepresentativeDocumentId?: string;

  @IsOptional()
  @IsString()
  relevantContacts?: string;

  @IsOptional()
  @IsString()
  clientRelationshipDuration?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  phoneCountry?: string;

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
