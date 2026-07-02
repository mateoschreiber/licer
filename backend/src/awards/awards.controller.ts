import { Body, Controller, Post } from '@nestjs/common';
import { AuthenticatedUser } from '../common/auth/authenticated-user.interface';
import { AuditAction } from '../common/decorators/audit-action.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { AwardsService } from './awards.service';
import { CreateAwardDto } from './dto/create-award.dto';
import { DecisionDto } from './dto/decision.dto';

@Controller('awards')
export class AwardsController {
  constructor(private readonly awardsService: AwardsService) {}

  @Permissions('awards:create:internal')
  @AuditAction({ action: 'AWARD_CREATE', entity: 'Award' })
  @Post()
  award(@Body() dto: CreateAwardDto, @CurrentUser() user: AuthenticatedUser) {
    return this.awardsService.award(dto, user);
  }

  @Permissions('awards:cancel:internal')
  @AuditAction({ action: 'AWARD_CANCEL', entity: 'Award' })
  @Post('cancel')
  cancel(@Body() dto: DecisionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.awardsService.cancel(dto, user);
  }

  @Permissions('awards:desert:internal')
  @AuditAction({ action: 'AWARD_DESERT', entity: 'Award' })
  @Post('desert')
  desert(@Body() dto: DecisionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.awardsService.desert(dto, user);
  }
}
