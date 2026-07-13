import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSupplierDocumentDto {
  @IsUUID()
  fileId!: string;

  @IsString()
  type!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
