CREATE TABLE "TenderBranch" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "name" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "deletedAt" TIMESTAMP(3), CONSTRAINT "TenderBranch_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "TenderBranch_name_key" ON "TenderBranch"("name");
ALTER TABLE "Tender" ADD COLUMN "branchId" UUID;
ALTER TABLE "Tender" ADD CONSTRAINT "Tender_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "TenderBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Tender_branchId_idx" ON "Tender"("branchId");
INSERT INTO "TenderBranch" ("name") VALUES ('KC'),('Suc1'),('Suc2'),('Suc3'),('Suc4'),('Suc5'),('Suc6'),('SucSJB'),('JDE3'),('JDE4'),('JDEC') ON CONFLICT ("name") DO NOTHING;