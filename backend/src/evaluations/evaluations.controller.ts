import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AuthenticatedUser } from '../common/auth/authenticated-user.interface';
import { AuditAction } from '../common/decorators/audit-action.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CreateCriteriaDto } from './dto/create-criteria.dto';
import { CreateScoreDto } from './dto/create-score.dto';
import { EvaluationsService } from './evaluations.service';

@Controller('evaluations')
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Permissions('evaluations:read:internal')
  @Get()
  findByTender(@Query('tenderId') tenderId: string) {
    return this.evaluationsService.findByTender(tenderId);
  }

  @Permissions('evaluations:create:internal')
  @AuditAction({ action: 'EVALUATION_CRITERIA_CREATE', entity: 'EvaluationCriteria' })
  @Post('criteria')
  createCriteria(@Body() dto: CreateCriteriaDto) {
    return this.evaluationsService.createCriteria(dto);
  }

  @Permissions('evaluations:update:internal')
  @AuditAction({ action: 'EVALUATION_SCORE_UPSERT', entity: 'EvaluationScore' })
  @Post()
  score(@Body() dto: CreateScoreDto, @CurrentUser() user: AuthenticatedUser) {
    return this.evaluationsService.score(dto, user);
  }
}
