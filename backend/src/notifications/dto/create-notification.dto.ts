import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateNotificationDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsUUID()
  tenderId?: string;

  @IsString()
  channel!: string;

  @IsString()
  subject!: string;

  @IsString()
  body!: string;
}
