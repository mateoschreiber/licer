import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AuditModule } from './audit/audit.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PasswordChangeRequiredGuard } from './common/guards/password-change-required.guard';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { TendersModule } from './tenders/tenders.module';
import { TenderDocumentsModule } from './tender-documents/tender-documents.module';
import { QuestionsModule } from './questions/questions.module';
import { BidsModule } from './bids/bids.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { AwardsModule } from './awards/awards.module';
import { FilesModule } from './files/files.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { RequestingAreasModule } from './requesting-areas/requesting-areas.module';
import { HealthModule } from './health/health.module';
import { TenderCategoriesModule } from './tender-categories/tender-categories.module';
import { TenderBranchesModule } from './tender-branches/tender-branches.module';
import { validateEnvironment } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    RolesModule,
    SuppliersModule,
    TendersModule,
    TenderDocumentsModule,
    QuestionsModule,
    BidsModule,
    EvaluationsModule,
    AwardsModule,
    FilesModule,
    ReportsModule,
    NotificationsModule,
    RequestingAreasModule,
    HealthModule,
    TenderCategoriesModule,
    TenderBranchesModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PasswordChangeRequiredGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
