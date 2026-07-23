# Tender Lifecycle

**Source files**: `backend/src/tenders/`, `backend/src/tender-documents/`, `backend/src/questions/`, `backend/prisma/schema.prisma`

## Tender Status State Machine

```
BORRADOR ──→ REVISION ──→ PUBLICADA ──→ CONSULTAS_CERRADAS ──→ RECEPCION ──→ CERRADA ──→ EVALUACION ──→ ADJUDICADA
                                                                                                    ├── CANCELADA
                                                                                                    ├── DESIERTA
                                                                                                    └── ARCHIVADA
```

The `TendersService` in `backend/src/tenders/tenders.service.ts` manages all transitions. Each transition is a method that validates the current status before proceeding.

### Status Details

| Status | Meaning | Allowed Previous States | Who Can Advance |
|--------|---------|------------------------|-----------------|
| `BORRADOR` | Draft — tender being created | — | Creator (AREA_SOLICITANTE, COMPRAS) |
| `REVISION` | Under internal review | BORRADOR | Creator |
| `PUBLICADA` | Visible to suppliers | REVISION | COMPRAS |
| `CONSULTAS_CERRADAS` | Q&A period closed | PUBLICADA | COMPRAS |
| `RECEPCION` | Receiving bids | CONSULTAS_CERRADAS, PUBLICADA | COMPRAS |
| `CERRADA` | Bid deadline passed, no more submissions | RECEPCION | COMPRAS (auto) |
| `EVALUACION` | Evaluation in progress | CERRADA | COMPRAS |
| `ADJUDICADA` | Awarded to a supplier | EVALUACION | APROBADOR |
| `CANCELADA` | Tender cancelled | Any active state | APROBADOR |
| `DESIERTA` | No valid bids received | EVALUACION, RECEPCION | APROBADOR |
| `ARCHIVADA` | Archived after completion | ADJUDICADA, CANCELADA, DESIERTA | COMPRAS |

## Tender Code Generation

Each tender gets a unique sequential code. The code generation in `TendersService` uses a daily count-based approach:

```typescript
// Simplified: count today's tenders + 1, format as sequential code
const todayCount = await prisma.tender.count({ where: { createdAt: { gte: startOfDay } } });
code = `LIC-${formatDate(new Date(), 'yyyyMMdd')}-${String(todayCount + 1).padStart(4, '0')}`;
```

**Known issue**: Two concurrent requests may generate the same code and hit the unique constraint. A retry-on-error (`P2002`) or a transactional sequence counter would be more robust.

## Tender Fields

Key fields on the `Tender` model:

| Field | Type | Purpose |
|-------|------|---------|
| `code` | String (unique) | Auto-generated visible identifier |
| `title`, `description` | String | Tender information |
| `currency` | String (default: "PYG") | Monetary denomination |
| `vatIncluded` | Boolean | Whether VAT is included in pricing |
| `paymentMethod`, `paymentTerms` | String? | Payment conditions |
| `offerValidityUntil` | DateTime? | How long offers remain valid |
| `allowBidReplacement` | Boolean | Whether suppliers can replace submitted bids |
| `responseDeadline` | DateTime? | Q&A response deadline |
| `questionDeadline` | DateTime? | Deadline for suppliers to ask questions |
| `bidDeadline` | DateTime (required) | Deadline for bid submission |
| `evaluationStart` | DateTime? | When evaluation begins |
| `estimatedAwardAt` | DateTime? | Target award date |
| `buyerId` | UUID? | Internal user responsible |
| `requestingAreaId` | UUID? | Requesting area reference |
| `categoryId` | UUID? | Tender category |
| `branchId` | UUID? | Tender branch |

## Tender Items

Each tender has 1+ `TenderItem` line items:

```
TenderItem
├── lot: String?              (grouping field)
├── description: String       (what is being procured)
├── unit: String              (e.g., "UNIDAD", "KILO", "LOTE")
├── quantity: Decimal(18,4)
├── specs: String?            (technical specifications)
├── referenceBrandModel: String?
├── allowsEquivalent: Boolean  (can substitutes be offered?)
├── minimumWarranty: String?
└── warrantyDocumentRequired: Boolean
```

## Tender Documents

Documents attached to a tender, managed by `TenderDocumentsService`:

| Type | Description |
|------|-------------|
| `BASE` | Base terms and conditions |
| `ANEXO` | Annex / appendix |
| `ADDENDA` | Addendum or amendment |
| `CONDICION` | Special conditions |
| `TECNICO` | Technical specification document |

Documents are versioned (starts at v1), linked to a `FileObject`, and can be voided. Internal users with `tender-documents:create:internal` permission can upload; published documents are visible to suppliers via `tender-documents:read:published`.

## Questions & Answers

**Source**: `backend/src/questions/questions.service.ts`

The Q&A system allows suppliers to ask questions about published tenders:

- Suppliers create questions with `questions:create:own` permission
- Questions are linked to a `Tender`, `Supplier`, and `User`
- Internal staff answer via `questions:answer:internal` permission
- One answer per question (unique `questionId` on `Answer`)
- Status workflow: `PENDIENTE → RESPONDIDA | RECHAZADA | ANULADA`
- Answers can be published with a `publishedAt` timestamp

## Key Business Rules (from TendersService)

1. Only suppliers with `ACTIVO` status can see published tenders
2. Code generation is daily-sequential and must be unique
3. State transitions are validated in service methods (no ORM-level enforcement)
4. Tender deadlines are used for validation but are not auto-enforced by the system
5. Deleting a tender is a soft-delete (`deletedAt`), preserving all related data

## Frontend Pages

| Page | Component (InternalPages.tsx) | Key Actions |
|------|-----------------------------|-------------|
| Tender list | `TendersManagementPage` | Search, filter, create |
| Create/Edit | `TenderCreateEditPage` | Full form with items, documents, dates |
| Detail (internal) | `TenderDetailInternalPage` | View bids, questions, documents, advance status |
| Available (supplier) | `AvailableTendersPage` | Browse published tenders |
| Detail (supplier) | `TenderDetailPage` | View tender info and bid eligibility |
| Documents (supplier) | `TenderDocumentsPage` | Download tender documents |
