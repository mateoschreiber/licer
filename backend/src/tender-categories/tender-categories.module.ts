import { Module } from '@nestjs/common';
import { TenderCategoriesController } from './tender-categories.controller';
import { TenderCategoriesService } from './tender-categories.service';
@Module({controllers:[TenderCategoriesController],providers:[TenderCategoriesService]}) export class TenderCategoriesModule {}
