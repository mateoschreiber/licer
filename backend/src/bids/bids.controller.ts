import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { AuthenticatedUser } from '../common/auth/authenticated-user.interface';
import { RequestWithUser } from '../common/auth/request-with-user.interface';
import { AuditAction } from '../common/decorators/audit-action.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { ReplaceBidDto } from './dto/replace-bid.dto';

@Controller('bids')
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Permissions('bids:read:own', 'bids:read:internal')
  @Get()
  findAll(@Query() query: PaginationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.bidsService.findAll(query, user);
  }

  @Permissions('bids:create:own')
  @Post()
  create(@Body() dto: CreateBidDto, @CurrentUser() user: AuthenticatedUser) {
    return this.bidsService.create(dto, user);
  }

  @Permissions('bids:read:own', 'bids:read:internal')
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return this.bidsService.findOne(id, user, request.ip);
  }

  @Permissions('bids:submit:own')
  @AuditAction({ action: 'BID_SUBMIT', entity: 'Bid' })
  @Post(':id/submit')
  submit(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.bidsService.submit(id, user);
  }

  @Permissions('bids:replace:own')
  @AuditAction({ action: 'BID_REPLACE', entity: 'Bid' })
  @Post(':id/replace')
  replace(
    @Param('id') id: string,
    @Body() dto: ReplaceBidDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bidsService.replace(id, dto, user);
  }
}
