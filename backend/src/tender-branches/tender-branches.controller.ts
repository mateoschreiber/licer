import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CreateTenderBranchDto } from './dto/create-tender-branch.dto';
import { TenderBranchesService } from './tender-branches.service';
@Controller('tender-branches')
export class TenderBranchesController {constructor(private readonly service:TenderBranchesService){}
 @Permissions('tenders:read:internal') @Get() findAll(){return this.service.findAll();}
 @Permissions('tenders:create:internal') @Post() create(@Body() dto:CreateTenderBranchDto){return this.service.create(dto);}
 @Permissions('tenders:update:internal') @Patch(':id') update(@Param('id') id:string,@Body() dto:CreateTenderBranchDto){return this.service.update(id,dto);}
 @Permissions('tenders:update:internal') @Delete(':id') remove(@Param('id') id:string){return this.service.remove(id);}
}