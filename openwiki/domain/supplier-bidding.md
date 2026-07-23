# Supplier Registration & Bidding

**Source files**: `backend/src/suppliers/`, `backend/src/bids/`, `backend/src/evaluations/`, `backend/src/awards/`, `backend/src/files/`

## Supplier Lifecycle

### Registration

Public self-registration at `/supplier/register` (SupplierRegisterPage):

1. Supplier fills form with RUC (Paraguayan tax ID), legal name, contact info, billing info, and creates a user account
2. Default status: `PENDIENTE`
3. Internal staff reviews and changes status via `suppliers:approve:internal` / `suppliers:block:internal`
4. Only `ACTIVO` suppliers can view published tenders and submit bids

### Supplier Status Workflow

```
PENDIENTE ──→ ACTIVO      (approved by COMPRAS/ADMIN)
          ──→ OBSERVADO   (needs correction)
          ──→ BLOQUEADO   (blocked)
          ──→ INACTIVO    (deactivated)
ACTIVO    ──→ OBSERVADO | BLOQUEADO | INACTIVO
OBSERVADO ──→ ACTIVO | BLOQUEADO | INACTIVO
```

### Supplier Staff

Managed by `SuppliersService` — each supplier can have multiple `SupplierStaff` members:

| Field | Purpose |
|-------|---------|
| `firstName`, `lastName` | Staff name |
| `documentId` | Identity document number |
| `phone`, `phoneCountry` | Contact number (+595 default for Paraguay) |
| `title` | Job title / role |

Staff are soft-deleted (`deletedAt`).

### Supplier Documents

Suppliers upload documents (e.g., tax clearance, certifications) via `SupplierDocumentsPage`:

- Document types are free-text (not an enum)
- Status workflow: `PENDIENTE → APROBADO | OBSERVADO | VENCIDO | ANULADO`
- Internal staff approve/observe documents
- Documents can have expiration dates (`expiresAt`)

## Bidding Flow

### Bid Status State Machine

```
BORRADOR ──→ ENVIADA ──→ EVALUADA
                  ├── REEMPLAZADA (if allowBidReplacement = true)
                  └── ANULADA
```

### Creating a Bid

1. Supplier navigates to `/supplier/bids/new` (CreateBidPage)
2. Selects a published tender
3. Fills line items (BidItem) matching TenderItems:
   - `quantity`, `unitPrice`, `tax`, `total`
   - Optional: `brand`, `model`, `brandModel`, `notes`
   - `pendingApproval: true` if offering a substitute (equivalent) item
4. Adds commercial terms: validity days, payment terms, delivery terms, VAT acceptance
5. Uploads supporting documents (BidDocument)
6. Saves as BORRADOR or submits directly

### Bid Submission

When a bid is submitted (`bids:submit:own`):
- Status changes from BORRADOR to ENVIADA
- A unique `receiptCode` is generated
- If `allowBidReplacement` is true on the tender, the supplier can submit a new version
- Previous active bid gets status REEMPLAZADA, linked via `replacedById`
- Unique constraint: `(tenderId, supplierId, version)` prevents duplicate versions

### Bid Detail Fields

| Field | Type | Description |
|-------|------|-------------|
| `totalAmount` | Decimal(18,2) | Computed bid total |
| `currency` | String (default: "PYG") | Guarani |
| `validityDays` | Int? | Offer validity period |
| `paymentTerms` | String? | Payment conditions |
| `deliveryTerms` | String? | Delivery conditions |
| `vatIncludedAccepted` | Boolean | VAT acceptance |
| `receiptCode` | String? (unique) | Generated on submission |
| `replacedById` | UUID? | Points to replacement bid |

### Bid Items

```
BidItem
├── tenderItemId: UUID?     (links to the original tender item)
├── quantity: Decimal(18,4)
├── unitPrice: Decimal(18,2)
├── tax: Decimal(18,2)      (default 0)
├── total: Decimal(18,2)    (computed)
├── description: String?    (optional custom description)
├── brand, model, brandModel
├── pendingApproval: Boolean (substitute item flag)
└── notes: String?
```

## Evaluation

**Source**: `backend/src/evaluations/`

After a tender reaches EVALUACION status, designated evaluators score bids:

### Evaluation Categories

| Category | Evaluator Role | Scope |
|----------|---------------|-------|
| `DOCUMENTAL` | EVALUADOR_TECNICO | Document compliance |
| `TECNICA` | EVALUADOR_TECNICO | Technical proposal quality |
| `ECONOMICA` | EVALUADOR_ECONOMICO | Price and financial aspects |

### Criteria

Each tender has configurable `EvaluationCriteria` records, per category:

```typescript
EvaluationCriteria {
  category: EvaluationCategory;  // DOCUMENTAL | TECNICA | ECONOMICA
  name: string;                  // e.g., "Experiencia del proveedor"
  description?: string;
  weight: Decimal(8,2);          // Relative weight for scoring
  maxScore: Decimal(8,2);        // Maximum achievable score
}
```

### Scoring

- `EvaluationScore` is unique per `(bidId, criteriaId, evaluatorId)` — each evaluator scores each bid+criterion once
- Evaluators use the frontend `BidDetailInternalPage` to enter scores

## Awards

**Source**: `backend/src/awards/`

### Award Status

| Status | Description |
|--------|-------------|
| `ADJUDICADA` | Tender awarded to winning supplier |
| `CANCELADA` | Tender cancelled (no award) |
| `DESIERTA` | No valid/qualified bids received |

### Award Flow

1. After evaluation, APROBADOR reviews scores and decides
2. Award records: which supplier + bid + amount + reason
3. Only one award per tender (no partial awards)
4. `AwardCancelDesertPage` in the frontend handles all three actions

## File Upload Rules

All file uploads share these rules (enforced in `FilesService`):

| Rule | Value |
|------|-------|
| Max size | 2 MB (2097152 bytes) |
| Allowed types | PDF, PNG, JPEG |
| Validation layers | Extension + MIME type + binary signature |
| Storage | Docker volume `storage_private` |
| Security | SHA256 hash recorded; uploadedBy tracked |
| Access | `files:download:own` (own files) or `files:download:internal` (any file) |

Suppliers can only associate files with their own profile; internal users can associate files with any supplier.

## Frontend Supplier Portal Pages

| Page (SupplierPages.tsx) | Route | Key Actions |
|--------------------------|-------|-------------|
| SupplierRegisterPage | `/supplier/register` | Self-registration form |
| SupplierProfilePage | `/supplier/profile` | View/edit profile, manage staff |
| SupplierDocumentsPage | `/supplier/documents` | Upload documents, view approval status |
| AvailableTendersPage | `/supplier/tenders` | Browse published tenders |
| TenderDetailPage | `/supplier/tenders/:id` | View tender requirements |
| TenderDocumentsPage | `/supplier/tenders/:id/documents` | Download tender docs |
| QuestionsAnswersPage | `/supplier/questions` | View own Q&A history |
| SupplierQuestionDetailPage | `/supplier/questions/:id` | Ask questions, view answers |
| CreateBidPage | `/supplier/bids/new` | Create and submit bid |
| MyBidDetailPage | `/supplier/bids/:id` | View submitted bid |
| SubmissionReceiptPage | `/supplier/receipt` | Post-submission confirmation |
