import { IsString, MinLength } from 'class-validator';

export class VoidTenderDocumentDto {
  @IsString()
  @MinLength(5)
  reason!: string;
}
