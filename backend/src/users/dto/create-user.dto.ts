import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { UserStatus } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  email!: string;
  @IsString()
  @MinLength(3)
  username!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  name!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsBoolean()
  mustChangePassword?: boolean;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsArray()
  @IsUUID('4', { each: true })
  roleIds!: string[];
}
