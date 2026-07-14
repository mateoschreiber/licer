CREATE UNIQUE INDEX "Bid_one_active_submission_per_supplier_tender"
ON "Bid" ("tenderId", "supplierId")
WHERE "deletedAt" IS NULL AND "status" IN ('ENVIADA', 'EVALUADA');
