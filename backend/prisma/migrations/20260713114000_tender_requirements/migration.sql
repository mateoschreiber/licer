CREATE TABLE "TenderCategory" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "name" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "deletedAt" TIMESTAMP(3), CONSTRAINT "TenderCategory_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "TenderCategory_name_key" ON "TenderCategory"("name");
ALTER TABLE "Tender" ADD COLUMN "categoryId" UUID, ADD COLUMN "responsibleEmail" TEXT, ADD COLUMN "responseDeadline" TIMESTAMP(3), ADD COLUMN "vatIncluded" BOOLEAN NOT NULL DEFAULT true, ADD COLUMN "paymentMethod" TEXT, ADD COLUMN "paymentTerms" TEXT, ADD COLUMN "offerValidityUntil" TIMESTAMP(3);
ALTER TABLE "TenderItem" ADD COLUMN "referenceBrandModel" TEXT, ADD COLUMN "allowsEquivalent" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "minimumWarranty" TEXT, ADD COLUMN "warrantyDocumentRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Tender" ADD CONSTRAINT "Tender_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TenderCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Tender_categoryId_idx" ON "Tender"("categoryId");
