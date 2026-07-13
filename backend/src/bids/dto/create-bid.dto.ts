import { Type } from 'class-transformer';
import {
  Equals,
  IsArray,
  IsBoolean,
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
  description?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  brandModel?: string;

  @IsOptional()
  @IsBoolean()
  pendingApproval = false;

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

  @IsBoolean()
  @Equals(true, { message: 'Debe aceptar que los precios incluyen IVA' })
  vatIncludedAccepted!: boolean;

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
