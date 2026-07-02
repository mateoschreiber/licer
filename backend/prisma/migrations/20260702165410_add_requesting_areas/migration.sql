-- CreateEnum
CREATE TYPE "RequestingAreaStatus" AS ENUM ('ACTIVA', 'INACTIVA');

-- CreateTable
CREATE TABLE "RequestingArea" (
    "id" UUID NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "RequestingAreaStatus" NOT NULL DEFAULT 'ACTIVA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RequestingArea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RequestingArea_code_key" ON "RequestingArea"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RequestingArea_name_key" ON "RequestingArea"("name");

-- CreateIndex
CREATE INDEX "RequestingArea_status_idx" ON "RequestingArea"("status");

-- AlterTable
ALTER TABLE "Tender" ADD COLUMN "requestingAreaId" UUID;

-- CreateIndex
CREATE INDEX "Tender_requestingAreaId_idx" ON "Tender"("requestingAreaId");

-- AddForeignKey
ALTER TABLE "Tender" ADD CONSTRAINT "Tender_requestingAreaId_fkey" FOREIGN KEY ("requestingAreaId") REFERENCES "RequestingArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;
