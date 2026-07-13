import { Module } from '@nestjs/common';
import { TenderBranchesController } from './tender-branches.controller';
import { TenderBranchesService } from './tender-branches.service';
@Module({controllers:[TenderBranchesController],providers:[TenderBranchesService]}) export class TenderBranchesModule {}
