# Domain & data model

Source: `/backend/prisma/schema.prisma` (~650 lines, 20+ models, 16 enums).

## Enums (state machines)

### TenderStatus
```
BORRADOR → REVISION → PUBLICADA → CONSULTAS_CERRADAS → RECEPCION → CERRADA
                                                                      ↓
                                                         EVALUACION → ADJUDICADA
                                                                   → CANCELADA
                                                                   → DESIERTA
                                                                   → ARCHIVADA
```

### BidStatus
```
BORRADOR → ENVIADA → EVALUADA
                  → REEMPLAZADA
                  → ANULADA
```

### Bid versioning
The `Bid` model has a unique constraint on `(tenderId, supplierId, version)`. When a supplier replaces a bid, `replacedById` points to the new bid and the old one's status becomes `REEMPLAZADA`. The `allowBidReplacement` flag on the tender controls whether this is permitted.

### SupplierStatus
```
PENDIENTE → ACTIVO
          → OBSERVADO
          → BLOQUEADO
          → INACTIVO
```

### DocumentStatus
```
PENDIENTE → APROBADO
          → OBSERVADO
          → VENCIDO
          → ANULADO
```

### QuestionStatus
```
PENDIENTE → RESPONDIDA
          → RECHAZADA
          → ANULADA
```

### EvaluationCategory
```
DOCUMENTAL, TECNICA, ECONOMICA
```

### AwardStatus
```
ADJUDICADA, CANCELADA, DESIERTA
```

## Core models

### User
- UUID PK, unique email, unique username
- Tracked: `lastLoginAt`, `failedLoginCount`, `lockedUntil`, `mustChangePassword`
- Soft-delete via `deletedAt`
- Linked to `Supplier` (optional) for supplier portal users
- Relations: roles, tenders (as buyer), uploaded files, questions, answers, bids, evaluation scores, awards, audit logs, notifications, auth sessions, password reset tokens

### Role & Permission
- Many-to-many through `UserRole` and `RolePermission`
- Permission format: `resource:action:scope` (e.g., `suppliers:approve:internal`)
- 60+ permissions defined in seed
- 7 roles: `ADMIN`, `COMPRAS`, `AREA_SOLICITANTE`, `EVALUADOR_TECNICO`, `EVALUADOR_ECONOMICO`, `APROBADOR`, `AUDITOR`, `PROVEEDOR`

### Supplier
- Unique RUC (Paraguayan tax ID)
- Fields: legal name, trade name, contact info, billing info, legal representative, staff, phone (with country code)
- `categories: String[]` — array of category tags
- Relations: users, staff, documents, questions, bids, awards, notifications

### SupplierStaff
- Individual staff members per supplier (firstName, lastName, documentId, phone, title)
- Soft-delete

### SupplierDocument
- Document attached to a supplier profile (type, file, status, expiration)
- Status workflow: PENDIENTE → APROBADO/OBSERVADO/VENCIDO/ANULADO

### Tender (the central entity)
- Unique `code` (auto-generated)
- Tracks: buyer, requesting area, category, branch, deadlines (response, question, bid, evaluation, estimated award)
- `currency: "PYG"` (Paraguayan Guarani), `vatIncluded`, `paymentMethod`, `paymentTerms`, `offerValidityUntil`
- Relations: items, documents, questions, bids, evaluation criteria, awards, answers, notifications

### TenderItem
- Line items within a tender (lot, description, unit, quantity, specs, brand/model, warranty)
- `allowsEquivalent` flag, `warrantyDocumentRequired` flag
- Decimal precision: 18,4 for quantity; 18,2 for monetary values

### TenderDocument
- Attachments per tender (type: BASE, ANEXO, ADDENDA, CONDICION, TECNICO)
- Versioned (starts at 1), published/void tracking

### Question & Answer
- Questions are tender-specific, authored by a supplier user
- One optional answer per question (unique `questionId`)
- Answers are published (visible to all suppliers based on tender settings)

### Bid
- Tender + Supplier + User relationship
- Versioned: unique constraint on `(tenderId, supplierId, version)`
- Status workflow, `replacedById` for bid replacement chain
- `totalAmount`, `currency`, `validityDays`, `paymentTerms`, `deliveryTerms`
- Unique `receiptCode` generated on submission

### BidItem
- Line items within a bid, referencing `TenderItem`
- `pendingApproval` flag for substitute items
- Decimal precision: 18,4 quantity, 18,2 unitPrice/tax/total

### BidDocument
- Supporting documents attached to a bid

### EvaluationCriteria & EvaluationScore
- Criteria defined per tender under a category (DOCUMENTAL, TECNICA, ECONOMICA)
- Weighted scoring system: `weight` (decimal) and `maxScore` (decimal)
- Scores are unique per `(bidId, criteriaId, evaluatorId)` — each evaluator scores each bid/criteria combination once

### Award
- Links tender → supplier → bid
- Amount, status, reason, approver

### AuditLog
- Records every action: actor, role, IP, action, entity, entityId, result (ALLOWED/DENIED/ERROR), metadata JSON
- Indexed on actorId, action, entity, entityId, createdAt

### FileObject
- File metadata: storagePath, originalName, mime, size (BigInt), sha256
- Uploaded by User
- Referenced by SupplierDocument, TenderDocument, BidDocument

### AuthSession
- Persisted refresh tokens with expiry and revocation

### PasswordResetToken
- Single-use tokens with hash, expiry, consumption tracking

### SecurityAttempt
- Rate-limiting key-value store: `key` (e.g., `login:192.168.1.1`), count, window, blockedUntil
- Used by `AuthSecurityService` for per-IP rate limiting

### RequestingArea
- `code` (unique), `name` (unique), description, status (ACTIVA/INACTIVA)

### TenderCategory / TenderBranch
- Simple catalogs: name + soft-delete

### Notification
- Channels: `email` (DB-backed record, email sending depends on SMTP config)
- Per-user and/or per-supplier
