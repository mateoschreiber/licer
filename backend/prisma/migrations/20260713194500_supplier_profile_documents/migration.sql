ALTER TABLE "Supplier"
  ADD COLUMN "billingEmail" TEXT,
  ADD COLUMN "billingAddress" TEXT,
  ADD COLUMN "legalRepresentative" TEXT,
  ADD COLUMN "relevantContacts" TEXT,
  ADD COLUMN "clientRelationshipDuration" TEXT;

UPDATE "Supplier"
SET "billingEmail" = "contactEmail"
WHERE "billingEmail" IS NULL;

UPDATE "Supplier"
SET "billingAddress" = COALESCE(NULLIF("address", ''), 'Pendiente de completar')
WHERE "billingAddress" IS NULL;

ALTER TABLE "Supplier"
  ALTER COLUMN "billingEmail" SET NOT NULL,
  ALTER COLUMN "billingAddress" SET NOT NULL;

ALTER TABLE "SupplierDocument"
  ADD COLUMN "description" TEXT;
