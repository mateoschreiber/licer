import { IsString, MinLength } from 'class-validator';
export class CreateTenderCategoryDto { @IsString() @MinLength(2) name!: string; }
