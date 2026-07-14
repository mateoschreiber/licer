import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AuthenticatedUser } from '../common/auth/authenticated-user.interface';
import { AuditAction } from '../common/decorators/audit-action.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QuestionsService } from './questions.service';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Permissions('questions:read:own', 'questions:read:internal')
  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('tenderId') tenderId?: string,
  ) {
    return this.questionsService.findAll(user, tenderId);
  }

  @Permissions('questions:read:own', 'questions:read:internal')
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.questionsService.findOne(id, user);
  }

  @Permissions('questions:create:own')
  @AuditAction({ action: 'QUESTION_CREATE', entity: 'Question' })
  @Post()
  create(@Body() dto: CreateQuestionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.questionsService.create(dto, user);
  }

  @Permissions('questions:answer:internal')
  @AuditAction({ action: 'QUESTION_ANSWER', entity: 'Question' })
  @Post(':id/answer')
  answer(
    @Param('id') id: string,
    @Body() dto: AnswerQuestionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.questionsService.answer(id, dto, user);
  }
}
