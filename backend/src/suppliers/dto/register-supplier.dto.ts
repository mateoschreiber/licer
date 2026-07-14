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

  @IsEmail()
  billingEmail!: string;

  @IsString()
  billingAddress!: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

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
  @IsString()
  @MinLength(3)
  username!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  phoneCountry?: string;

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
