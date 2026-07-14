import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CreateTenderCategoryDto } from './dto/create-tender-category.dto';
import { TenderCategoriesService } from './tender-categories.service';
@Controller('tender-categories')
export class TenderCategoriesController {
  constructor(private readonly service: TenderCategoriesService) {}
  @Permissions('tenders:read:internal') @Get() findAll() {
    return this.service.findAll();
  }
  @Permissions('tenders:create:internal') @Post() create(@Body() dto: CreateTenderCategoryDto) {
    return this.service.create(dto);
  }
  @Permissions('tenders:update:internal') @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: CreateTenderCategoryDto,
  ) {
    return this.service.update(id, dto);
  }
  @Permissions('tenders:update:internal') @Delete(':id') remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
