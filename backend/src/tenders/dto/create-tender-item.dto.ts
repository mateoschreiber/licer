import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';
export class CreateTenderItemDto {
  @IsOptional() @IsString() lot?: string;
  @IsString() description!: string;
  @IsString() unit!: string;
  @IsNumber() @Min(0) quantity!: number;
  @IsOptional() @IsString() specs?: string;
  @IsOptional() @IsString() referenceBrandModel?: string;
  @IsOptional() @IsBoolean() allowsEquivalent?: boolean;
  @IsOptional() @IsString() minimumWarranty?: string;
  @IsOptional() @IsBoolean() warrantyDocumentRequired?: boolean;
}
