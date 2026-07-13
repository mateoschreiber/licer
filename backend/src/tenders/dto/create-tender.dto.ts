import { IsBoolean, IsDateString, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
export class CreateTenderDto {
 @IsOptional() @IsString() code?: string;
 @IsString() title!: string;
 @IsString() description!: string;
 @IsOptional() @IsIn(['PYG','USD']) currency?: string;
 @IsOptional() @IsUUID() categoryId?: string;
 @IsOptional() @IsUUID() branchId?: string;
 @IsOptional() @IsUUID() requestingAreaId?: string;
 @IsOptional() @IsString() requesterArea?: string;
 @IsOptional() @IsString() responsibleEmail?: string;
 @IsOptional() @IsBoolean() allowBidReplacement?: boolean;
 @IsOptional() @IsBoolean() vatIncluded?: boolean;
 @IsOptional() @IsIn(['CONTADO','CREDITO']) paymentMethod?: string;
 @IsOptional() @IsString() paymentTerms?: string;
 @IsOptional() @IsDateString() publishedAt?: string;
 @IsOptional() @IsDateString() questionDeadline?: string;
 @IsOptional() @IsDateString() responseDeadline?: string;
 @IsOptional() @IsDateString() bidDeadline?: string;
 @IsOptional() @IsDateString() offerValidityUntil?: string;
 @IsOptional() @IsDateString() evaluationStart?: string;
 @IsOptional() @IsDateString() estimatedAwardAt?: string;
}