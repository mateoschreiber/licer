import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateBidItemDto {
  @IsOptional()
  @IsUUID()
  tenderItemId?: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsNumber()
  @Min(0)
  tax = 0;

  @IsNumber()
  @Min(0)
  total!: number;

  @IsOptional()
  @IsString()
  brandModel?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateBidDocumentDto {
  @IsUUID()
  fileId!: string;

  @IsString()
  type!: string;
}

export class CreateBidDto {
  @IsUUID()
  tenderId!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  validityDays?: number;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsString()
  deliveryTerms?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBidItemDto)
  items: CreateBidItemDto[] = [];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBidDocumentDto)
  documents?: CreateBidDocumentDto[];
}
