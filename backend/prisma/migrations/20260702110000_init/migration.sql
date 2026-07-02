CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');
CREATE TYPE "SupplierStatus" AS ENUM ('PENDIENTE', 'ACTIVO', 'OBSERVADO', 'BLOQUEADO', 'INACTIVO');
CREATE TYPE "DocumentStatus" AS ENUM ('PENDIENTE', 'APROBADO', 'OBSERVADO', 'VENCIDO', 'ANULADO');
CREATE TYPE "TenderStatus" AS ENUM ('BORRADOR', 'REVISION', 'PUBLICADA', 'CONSULTAS_CERRADAS', 'RECEPCION', 'CERRADA', 'EVALUACION', 'ADJUDICADA', 'CANCELADA', 'DESIERTA', 'ARCHIVADA');
CREATE TYPE "TenderDocumentType" AS ENUM ('BASE', 'ANEXO', 'ADDENDA', 'CONDICION', 'TECNICO');
CREATE TYPE "QuestionStatus" AS ENUM ('PENDIENTE', 'RESPONDIDA', 'RECHAZADA', 'ANULADA');
CREATE TYPE "BidStatus" AS ENUM ('BORRADOR', 'ENVIADA', 'REEMPLAZADA', 'ANULADA', 'EVALUADA');
CREATE TYPE "EvaluationCategory" AS ENUM ('DOCUMENTAL', 'TECNICA', 'ECONOMICA');
CREATE TYPE "AwardStatus" AS ENUM ('ADJUDICADA', 'CANCELADA', 'DESIERTA');
CREATE TYPE "AuditResult" AS ENUM ('ALLOWED', 'DENIED', 'ERROR');
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

CREATE TABLE "Supplier" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ruc" TEXT NOT NULL,
  "legalName" TEXT NOT NULL,
  "tradeName" TEXT,
  "contactName" TEXT NOT NULL,
  "contactEmail" TEXT NOT NULL,
  "phone" TEXT,
  "address" TEXT,
  "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" "SupplierStatus" NOT NULL DEFAULT 'PENDIENTE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "supplierId" UUID,
  "lastLoginAt" TIMESTAMP(3),
  "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
  "lockedUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "User_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Role" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Permission" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL,
  "resource" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserRole" (
  "userId" UUID NOT NULL,
  "roleId" UUID NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId"),
  CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "RolePermission" (
  "roleId" UUID NOT NULL,
  "permissionId" UUID NOT NULL,
  CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId"),
  CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Tender" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "TenderStatus" NOT NULL DEFAULT 'BORRADOR',
  "currency" TEXT NOT NULL DEFAULT 'PYG',
  "buyerId" UUID,
  "requesterArea" TEXT,
  "allowBidReplacement" BOOLEAN NOT NULL DEFAULT true,
  "publishedAt" TIMESTAMP(3),
  "questionDeadline" TIMESTAMP(3),
  "bidDeadline" TIMESTAMP(3) NOT NULL,
  "evaluationStart" TIMESTAMP(3),
  "estimatedAwardAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Tender_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Tender_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "TenderItem" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenderId" UUID NOT NULL,
  "lot" TEXT,
  "description" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "quantity" DECIMAL(18,4) NOT NULL,
  "specs" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "TenderItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TenderItem_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "FileObject" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "storagePath" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "mime" TEXT NOT NULL,
  "size" BIGINT NOT NULL,
  "sha256" TEXT NOT NULL,
  "uploadedById" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "FileObject_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FileObject_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "SupplierDocument" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "supplierId" UUID NOT NULL,
  "type" TEXT NOT NULL,
  "fileId" UUID NOT NULL,
  "status" "DocumentStatus" NOT NULL DEFAULT 'PENDIENTE',
  "expiresAt" TIMESTAMP(3),
  "voidedAt" TIMESTAMP(3),
  "voidReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "SupplierDocument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SupplierDocument_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupplierDocument_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileObject"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "TenderDocument" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenderId" UUID NOT NULL,
  "type" "TenderDocumentType" NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "title" TEXT NOT NULL,
  "fileId" UUID NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "voidedAt" TIMESTAMP(3),
  "voidReason" TEXT,
  "createdById" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TenderDocument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TenderDocument_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TenderDocument_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileObject"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TenderDocument_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Question" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenderId" UUID NOT NULL,
  "supplierId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "text" TEXT NOT NULL,
  "status" "QuestionStatus" NOT NULL DEFAULT 'PENDIENTE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Question_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Question_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Question_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Question_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Answer" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "questionId" UUID,
  "tenderId" UUID NOT NULL,
  "text" TEXT NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "authorId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "voidedAt" TIMESTAMP(3),
  CONSTRAINT "Answer_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Answer_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Answer_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Bid" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenderId" UUID NOT NULL,
  "supplierId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" "BidStatus" NOT NULL DEFAULT 'BORRADOR',
  "submittedAt" TIMESTAMP(3),
  "replacedById" UUID,
  "totalAmount" DECIMAL(18,2),
  "currency" TEXT NOT NULL DEFAULT 'PYG',
  "validityDays" INTEGER,
  "paymentTerms" TEXT,
  "deliveryTerms" TEXT,
  "receiptCode" TEXT,
  "voidedAt" TIMESTAMP(3),
  "voidReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Bid_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Bid_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Bid_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Bid_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Bid_replacedById_fkey" FOREIGN KEY ("replacedById") REFERENCES "Bid"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "BidItem" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "bidId" UUID NOT NULL,
  "tenderItemId" UUID,
  "quantity" DECIMAL(18,4) NOT NULL,
  "unitPrice" DECIMAL(18,2) NOT NULL,
  "tax" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "total" DECIMAL(18,2) NOT NULL,
  "brandModel" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "BidItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BidItem_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "BidItem_tenderItemId_fkey" FOREIGN KEY ("tenderItemId") REFERENCES "TenderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "BidDocument" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "bidId" UUID NOT NULL,
  "fileId" UUID NOT NULL,
  "type" TEXT NOT NULL,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "voidedAt" TIMESTAMP(3),
  "voidReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BidDocument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BidDocument_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "BidDocument_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileObject"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "EvaluationCriteria" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenderId" UUID NOT NULL,
  "category" "EvaluationCategory" NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "weight" DECIMAL(8,2) NOT NULL,
  "maxScore" DECIMAL(8,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "EvaluationCriteria_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EvaluationCriteria_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "EvaluationScore" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "bidId" UUID NOT NULL,
  "criteriaId" UUID NOT NULL,
  "evaluatorId" UUID NOT NULL,
  "score" DECIMAL(8,2) NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "EvaluationScore_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EvaluationScore_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "EvaluationScore_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES "EvaluationCriteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "EvaluationScore_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Award" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenderId" UUID NOT NULL,
  "supplierId" UUID,
  "bidId" UUID,
  "amount" DECIMAL(18,2),
  "status" "AwardStatus" NOT NULL,
  "reason" TEXT NOT NULL,
  "approvedById" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Award_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Award_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Award_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Award_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Award_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "AuditLog" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "actorId" UUID,
  "role" TEXT,
  "ip" TEXT,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "result" "AuditResult" NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Notification" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID,
  "supplierId" UUID,
  "tenderId" UUID,
  "channel" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
  "metadata" JSONB,
  "readAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Notification_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Notification_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Supplier_ruc_key" ON "Supplier"("ruc");
CREATE INDEX "Supplier_status_idx" ON "Supplier"("status");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_supplierId_idx" ON "User"("supplierId");
CREATE INDEX "User_status_idx" ON "User"("status");
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");
CREATE UNIQUE INDEX "Permission_resource_action_scope_key" ON "Permission"("resource", "action", "scope");
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");
CREATE INDEX "SupplierDocument_supplierId_idx" ON "SupplierDocument"("supplierId");
CREATE INDEX "SupplierDocument_fileId_idx" ON "SupplierDocument"("fileId");
CREATE INDEX "SupplierDocument_status_idx" ON "SupplierDocument"("status");
CREATE UNIQUE INDEX "Tender_code_key" ON "Tender"("code");
CREATE INDEX "Tender_status_idx" ON "Tender"("status");
CREATE INDEX "Tender_buyerId_idx" ON "Tender"("buyerId");
CREATE INDEX "Tender_bidDeadline_idx" ON "Tender"("bidDeadline");
CREATE INDEX "TenderItem_tenderId_idx" ON "TenderItem"("tenderId");
CREATE INDEX "TenderDocument_tenderId_idx" ON "TenderDocument"("tenderId");
CREATE INDEX "TenderDocument_fileId_idx" ON "TenderDocument"("fileId");
CREATE INDEX "TenderDocument_type_idx" ON "TenderDocument"("type");
CREATE INDEX "Question_tenderId_idx" ON "Question"("tenderId");
CREATE INDEX "Question_supplierId_idx" ON "Question"("supplierId");
CREATE INDEX "Question_status_idx" ON "Question"("status");
CREATE UNIQUE INDEX "Answer_questionId_key" ON "Answer"("questionId");
CREATE INDEX "Answer_tenderId_idx" ON "Answer"("tenderId");
CREATE INDEX "Answer_authorId_idx" ON "Answer"("authorId");
CREATE UNIQUE INDEX "Bid_tenderId_supplierId_version_key" ON "Bid"("tenderId", "supplierId", "version");
CREATE UNIQUE INDEX "Bid_receiptCode_key" ON "Bid"("receiptCode");
CREATE INDEX "Bid_tenderId_idx" ON "Bid"("tenderId");
CREATE INDEX "Bid_supplierId_idx" ON "Bid"("supplierId");
CREATE INDEX "Bid_status_idx" ON "Bid"("status");
CREATE INDEX "Bid_submittedAt_idx" ON "Bid"("submittedAt");
CREATE INDEX "BidItem_bidId_idx" ON "BidItem"("bidId");
CREATE INDEX "BidItem_tenderItemId_idx" ON "BidItem"("tenderItemId");
CREATE INDEX "BidDocument_bidId_idx" ON "BidDocument"("bidId");
CREATE INDEX "BidDocument_fileId_idx" ON "BidDocument"("fileId");
CREATE INDEX "EvaluationCriteria_tenderId_idx" ON "EvaluationCriteria"("tenderId");
CREATE INDEX "EvaluationCriteria_category_idx" ON "EvaluationCriteria"("category");
CREATE UNIQUE INDEX "EvaluationScore_bidId_criteriaId_evaluatorId_key" ON "EvaluationScore"("bidId", "criteriaId", "evaluatorId");
CREATE INDEX "EvaluationScore_bidId_idx" ON "EvaluationScore"("bidId");
CREATE INDEX "EvaluationScore_criteriaId_idx" ON "EvaluationScore"("criteriaId");
CREATE INDEX "EvaluationScore_evaluatorId_idx" ON "EvaluationScore"("evaluatorId");
CREATE INDEX "Award_tenderId_idx" ON "Award"("tenderId");
CREATE INDEX "Award_supplierId_idx" ON "Award"("supplierId");
CREATE INDEX "Award_status_idx" ON "Award"("status");
CREATE INDEX "FileObject_uploadedById_idx" ON "FileObject"("uploadedById");
CREATE INDEX "FileObject_sha256_idx" ON "FileObject"("sha256");
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_supplierId_idx" ON "Notification"("supplierId");
CREATE INDEX "Notification_tenderId_idx" ON "Notification"("tenderId");
CREATE INDEX "Notification_status_idx" ON "Notification"("status");
