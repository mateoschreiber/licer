import { TenderDocumentType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTenderDocumentDto {
  @IsUUID()
  tenderId!: string;

  @IsEnum(TenderDocumentType)
  type!: TenderDocumentType;

  @IsString()
  title!: string;

  @IsUUID()
  fileId!: string;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}
