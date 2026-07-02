import { Module } from '@nestjs/common';
import { RequestingAreasController } from './requesting-areas.controller';
import { RequestingAreasService } from './requesting-areas.service';

@Module({
  controllers: [RequestingAreasController],
  providers: [RequestingAreasService],
})
export class RequestingAreasModule {}
