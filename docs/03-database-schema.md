# 📄 03 — Database Schema

## 1. Introduction

This document is the technical reference for the AZ CRM & Product Manager database schema.
It is generated from and must remain aligned with `prisma/schema.prisma`, which is the **single source of truth**.

**Stack:**
- Database: PostgreSQL
- ORM: Prisma (Client JS)
- Monetary values: `Decimal @db.Decimal(12, 2)` — never `Float`
- IDs: `cuid()` — collision-resistant, URL-safe

> Any change to the schema must be reflected in this document. Any change to this document that implies a structural change must be reflected in the schema.

---

## 2. Enumerations

All enums are defined at the Prisma level and enforced by PostgreSQL as native enum types.

### `Role`
Controls system-level permissions.

| Value | Description |
|---|---|
| `SUPERADMIN` | Full system access, including future user management |
| `USER` | Full operational access (MVP) |

### `Profile`
Controls the user's UI experience and focus area. Independent from `Role`.

| Value | Description |
|---|---|
| `MARKETER` | Marketing-focused view, content/social kanban |
| `DEVELOPER` | Development-focused view, software kanban |

### `SystemType`
Defines the nature of a system/project.

| Value | Description |
|---|---|
| `SAAS` | AZ Marketing's own product. No client association required. |
| `CUSTOM` | Custom development for a client. `clientId` is mandatory (backend-enforced). |

### `SystemStatus`
Operational state of a system.

| Value | Description |
|---|---|
| `ACTIVE` | System is live and operational |
| `MAINTENANCE` | System is temporarily unavailable or under work |
| `DEPRECATED` | System is no longer maintained |

### `ClientStatus`
Reflects the commercial/health state of a client.

| Value | Description |
|---|---|
| `ACTIVE` | Client is active and in good standing |
| `INACTIVE` | Client is not currently active |
| `AT_RISK` | Client has overdue payments or other risk indicators |

### `BudgetStatus`
Lifecycle state of a budget/proposal.

| Value | Description |
|---|---|
| `DRAFT` | Being prepared, not yet sent |
| `SENT` | Delivered to the client, awaiting response |
| `ACCEPTED` | Client accepted — triggers automatic Obligation creation |
| `REJECTED` | Client rejected the proposal |

### `PaymentPlanType`
Defines how a payment plan item's `amount` is interpreted.

| Value | Convention |
|---|---|
| `PERCENTAGE` | `amount` is a value between `0` and `100` representing a percentage (e.g., `50` = 50%) |
| `FIXED` | `amount` is the exact monetary value to be paid |

> **Backend responsibility:** When a `PERCENTAGE` item is converted to an `Obligation`, the backend must calculate the real amount from `budget.totalAmount × (amount / 100)`.

### `ObligationStatus`
Tracks the payment state of a debt.

| Value | Description |
|---|---|
| `PENDING` | Client has not yet paid this obligation |
| `PAID` | Obligation has been settled (one or more movements registered) |

### `MovementType`
Classifies a financial movement.

| Value | Description |
|---|---|
| `INCOME` | Money received |
| `EXPENSE` | Money spent |

### `PaymentMethod`
The method used in a real financial movement.

| Value | Description |
|---|---|
| `CASH` | Physical cash |
| `TRANSFER` | Bank transfer |
| `CARD` | Debit or credit card |
| `OTHER` | Any other method |

### `KanbanArea`
Associates kanban columns with a specific operational area.

| Value | Description |
|---|---|
| `MARKETING` | Marketing team workflow |
| `SOFTWARE` | Software development workflow |

### `TaskPriority`
Indicates the urgency of a task.

| Value | Description |
|---|---|
| `LOW` | Non-urgent |
| `MEDIUM` | Default priority |
| `HIGH` | Important and time-sensitive |
| `URGENT` | Requires immediate attention |

### `Currency`
Supported currencies for financial entities.

| Value | Description |
|---|---|
| `ARS` | Argentine Peso (default) |
| `USD` | US Dollar |

---

## 3. Models

### 3.1 `User`

Represents a system operator.

```
id          String    PK, cuid
email       String    unique
name        String
password    String    hashed (backend responsibility)
role        Role      default: USER
profile     Profile   default: MARKETER
createdAt   DateTime  auto
updatedAt   DateTime  auto
```

**Relations:**
- `tasksAssigned Task[]` — tasks assigned to this user (`"TaskAssignee"`)
- `tasksCreated Task[]` — tasks created by this user (`"TaskCreator"`)

**Notes:**
- `role` controls what the user can do.
- `profile` controls what the user sees (UI filtering).
- Password hashing is the backend's responsibility; the schema stores the hash.

---

### 3.2 `Tag`

Controlled classification labels for clients. Not free-form — tags are defined by the system.

```
id      String    PK, cuid
name    String    unique
color   String?   optional hex/label for UI
```

**Relations:**
- `clients ClientTag[]` — clients associated with this tag

**Notes:**
- Tags are seeded and managed by admins, not created freely by users.
- Used as primary filters in the client dashboard.

---

### 3.3 `Client`

The central entity of the system. All commercial activity revolves around a client.

```
id        String        PK, cuid
name      String
email     String?
phone     String?
company   String?
notes     String?       free-text internal notes
status    ClientStatus  default: ACTIVE
createdAt DateTime      auto
updatedAt DateTime      auto
deletedAt DateTime?     soft delete
```

**Relations:**
- `tags ClientTag[]` — many-to-many with Tag via ClientTag
- `systems System[]` — systems linked to this client
- `budgets Budget[]` — proposals/sales linked to this client
- `obligations Obligation[]` — debt records linked to this client
- `movements FinancialMovement[]` — real cash movements linked to this client
- `tasks Task[]` — tasks associated with this client

**Notes:**
- `deletedAt` implements soft delete. Queries must filter `deletedAt: null` to exclude deleted records.
- `status` can be updated automatically by the backend based on overdue obligations (e.g., set to `AT_RISK` when obligations are overdue).

---

### 3.4 `ClientTag`

Junction table for the many-to-many relationship between `Client` and `Tag`.

```
clientId  String  FK → Client.id (cascade delete)
tagId     String  FK → Tag.id (cascade delete)
```

**Constraints:**
- Composite PK: `(clientId, tagId)` — prevents duplicate tag assignments.
- `onDelete: Cascade` on both sides — removing a client removes all its tag associations; removing a tag removes all client associations.

---

### 3.5 `System`

Represents a software product or project. Can be an internal SAAS product or a custom development for a client.

```
id          String        PK, cuid
name        String
description String?
type        SystemType    SAAS | CUSTOM
status      SystemStatus? optional
repoUrl     String?       link to repository
clientId    String?       FK → Client.id (nullable)
createdAt   DateTime      auto
updatedAt   DateTime      auto
deletedAt   DateTime?     soft delete
```

**Relations:**
- `client Client?` — optional link to a client
- `tasks Task[]` — tasks scoped to this system

**Indexes:**
- `@@index([clientId])` — efficient lookup of systems per client
- `@@index([type])` — efficient filtering by SAAS / CUSTOM

**Backend validation:**
- If `type = CUSTOM`, then `clientId` must not be null.
- If `type = SAAS`, `clientId` should be null (not enforced at DB level, enforced in service layer).

---

### 3.6 `Budget`

Represents a commercial proposal or quote sent to a client.

```
id          String        PK, cuid
title       String
description String?
currency    Currency      default: ARS
totalAmount Decimal(12,2)
status      BudgetStatus  default: DRAFT
clientId    String        FK → Client.id
createdAt   DateTime      auto
updatedAt   DateTime      auto
deletedAt   DateTime?     soft delete
```

**Relations:**
- `client Client` — required owner of this budget
- `paymentPlanItems PaymentPlanItem[]` — how the budget is split into payment installments
- `obligations Obligation[]` — debt records generated when this budget is accepted

**Indexes:**
- `@@index([clientId])` — list budgets per client
- `@@index([status])` — filter by pipeline stage

**Backend automation:**
- When `status` transitions to `ACCEPTED`, the backend must iterate over all `paymentPlanItems` and create one `Obligation` per item.
- Once `ACCEPTED` or `REJECTED`, the budget should not be editable.

---

### 3.7 `PaymentPlanItem`

Defines a single installment within a budget's payment plan. Each item maps 1:1 to an `Obligation` upon budget acceptance.

```
id       String          PK, cuid
order    Int             display/execution order
budgetId String          FK → Budget.id (cascade delete)
amount   Decimal(12,2)   interpretation depends on type
type     PaymentPlanType PERCENTAGE | FIXED
dueDate  DateTime        when this installment is due
```

**Relations:**
- `budget Budget` — parent budget
- `obligation Obligation?` — the obligation generated from this item (1:1, optional until budget is accepted)

**Indexes:**
- `@@index([budgetId])` — fetch all items for a given budget
- `@@index([order])` — sort items within a budget

**Amount convention:**
| Type | Interpretation |
|---|---|
| `PERCENTAGE` | `amount` = 0–100. Backend calculates: `budget.totalAmount × (amount / 100)` |
| `FIXED` | `amount` = exact monetary value |

**Backend validation:**
- If `type = PERCENTAGE`, `amount` must be between `0` and `100`.
- The sum of all FIXED items should not exceed `budget.totalAmount`.
- The sum of all PERCENTAGE items should equal `100`.

---

### 3.8 `Obligation`

Represents a unit of debt — what a client owes, derived from an accepted budget. This is **not** real money; it is a financial commitment.

```
id                String           PK, cuid
currency          Currency         default: ARS
amount            Decimal(12,2)    real monetary value (already resolved from percentage if applicable)
dueDate           DateTime         when payment is due
status            ObligationStatus default: PENDING
clientId          String           FK → Client.id
budgetId          String?          FK → Budget.id (optional)
paymentPlanItemId String?          FK → PaymentPlanItem.id (unique, 1:1)
createdAt         DateTime         auto
updatedAt         DateTime         auto
```

**Relations:**
- `client Client` — the debtor
- `budget Budget?` — the budget that originated this obligation (for traceability)
- `paymentPlanItem PaymentPlanItem?` — the specific installment that generated this obligation (1:1)
- `movements FinancialMovement[]` — real payments applied against this obligation (1:many — supports partial payments)

**Indexes:**
- `@@index([clientId])` — debt per client
- `@@index([status])` — filter PENDING obligations
- `@@index([dueDate])` — upcoming due dates for alerts and dashboard

**Notes:**
- `paymentPlanItemId` has `@unique` — one obligation per plan item, guaranteed.
- An obligation can be paid across multiple `FinancialMovement` records (partial payments).
- When all movements for an obligation sum to its `amount`, the backend should mark it as `PAID`.
- Obligations can also be created manually (without a `paymentPlanItemId`) for ad-hoc charges.

---

### 3.9 `FinancialMovement`

Represents a real cash transaction — actual money received or spent. This is the **ledger record**, not a debt.

```
id            String        PK, cuid
currency      Currency      default: ARS
type          MovementType  INCOME | EXPENSE
amount        Decimal(12,2)
description   String?       optional note
paymentMethod PaymentMethod CASH | TRANSFER | CARD | OTHER
date          DateTime      real date of the transaction (not createdAt)
clientId      String?       FK → Client.id (optional)
obligationId  String?       FK → Obligation.id (optional)
createdAt     DateTime      auto
```

**Relations:**
- `client Client?` — optional client association
- `obligation Obligation?` — optional link to the obligation being paid

**Indexes:**
- `@@index([clientId])` — movements per client
- `@@index([date])` — chronological queries and period filtering

**Notes:**
- `obligationId` is nullable — allows recording expenses or income not related to any obligation.
- Multiple movements can reference the same `obligationId` (partial payments).
- `date` is the real transaction date and must be set explicitly — it differs from `createdAt` (entry date).
- EXPENSE movements are not linked to obligations (expenses are not client debt).

---

### 3.10 `KanbanColumn`

Defines a column in a Kanban board. Columns are scoped per `KanbanArea` — each area has its own independent workflow.

```
id    String     PK, cuid
name  String
area  KanbanArea MARKETING | SOFTWARE
order Int        position in the board (left to right)
color String?    optional color for UI rendering
```

**Relations:**
- `tasks Task[]` — tasks currently in this column

**Constraints:**
- `@@unique([area, order])` — no two columns in the same area can share a position.
- `@@unique([area, name])` — no two columns in the same area can share a name.

**Notes:**
- KanbanColumns are seeded data. They define the workflow for each area and are not created dynamically by users.
- Moving a task between columns is done by updating `task.kanbanColumnId`.

---

### 3.11 `Task`

The unit of work in the system. Tasks live within a Kanban board and are always associated with a client or a system.

```
id             String       PK, cuid
title          String
description    String?
priority       TaskPriority default: MEDIUM
dueDate        DateTime?    optional deadline
kanbanColumnId String       FK → KanbanColumn.id
clientId       String?      FK → Client.id (optional)
systemId       String?      FK → System.id (optional)
assignedToId   String?      FK → User.id (optional)
createdById    String       FK → User.id (required)
createdAt      DateTime     auto
updatedAt      DateTime     auto
deletedAt      DateTime?    soft delete
```

**Relations:**
- `kanbanColumn KanbanColumn` — current position in the board
- `client Client?` — client this task belongs to
- `system System?` — system this task belongs to
- `assignedTo User?` — user responsible for the task (`"TaskAssignee"`)
- `createdBy User` — user who created the task (`"TaskCreator"`)

**Indexes:**
- `@@index([kanbanColumnId])` — tasks per column (board view)
- `@@index([assignedToId])` — tasks per user (my tasks view)
- `@@index([clientId])` — tasks per client (client 360 view)
- `@@index([systemId])` — tasks per system (system view)

**Backend validation (not enforced at DB level):**
- At least one of `clientId` or `systemId` must be set.
- A task cannot be created with neither reference — it must have context.

**Notes:**
- `assignedToId` is optional — tasks can exist unassigned.
- `createdById` is always required for traceability.
- `deletedAt` implements soft delete — deleted tasks are hidden but not destroyed.

---

## 4. Relationship Map

```
User ──────────────────────────────┐
  │                                │
  │ (createdBy / assignedTo)       │
  ▼                                │
Task ◄────── KanbanColumn          │
  │  (area: MARKETING/SOFTWARE)    │
  ├──► Client ◄──────────────────── ┘
  │      │
  │      ├──► ClientTag ◄──► Tag
  │      ├──► System
  │      │      └──► Task
  │      ├──► Budget
  │      │      └──► PaymentPlanItem ──► Obligation
  │      ├──► Obligation                    │
  │      │      └──► FinancialMovement ◄────┘
  │      └──► FinancialMovement
  └──► System
```

**Key relationship types:**

| Relationship | Type | Notes |
|---|---|---|
| `Client ↔ Tag` | Many-to-many | Via `ClientTag` junction |
| `Client → System` | One-to-many | CUSTOM systems only |
| `Client → Budget` | One-to-many | — |
| `Budget → PaymentPlanItem` | One-to-many | Cascade delete |
| `PaymentPlanItem → Obligation` | One-to-one | Generated on budget acceptance |
| `Client → Obligation` | One-to-many | Direct for traceability |
| `Obligation → FinancialMovement` | One-to-many | Supports partial payments |
| `Task → User` | Many-to-one (×2) | `assignedTo` and `createdBy` |
| `Task → Client or System` | Many-to-one | At least one required |
| `KanbanColumn → Task` | One-to-many | Area-scoped |

---

## 5. Financial Model

The financial model deliberately separates two concepts that must never be conflated:

### 5.1 Obligations — What is owed (Deuda)

`Obligation` records represent formal payment commitments from the client.

- Created automatically when a `Budget` transitions to `ACCEPTED`.
- One `Obligation` is created per `PaymentPlanItem`.
- State: `PENDING` → `PAID`.
- They represent accounting receivables — money that should come in.

### 5.2 Financial Movements — Real cash (Caja)

`FinancialMovement` records represent actual transactions.

- Can be `INCOME` or `EXPENSE`.
- Include a real `date`, `paymentMethod`, and optional link to an `Obligation`.
- They represent the actual cash ledger — money that actually moved.

### 5.3 Why this separation matters

| Query | Use |
|---|---|
| Total billed | Sum of `Budget.totalAmount` where `status = ACCEPTED` |
| Total collected | Sum of `FinancialMovement.amount` where `type = INCOME` |
| Pending debt | Sum of `Obligation.amount` where `status = PENDING` |
| Upcoming due dates | `Obligation` where `status = PENDING` ordered by `dueDate` |
| Cash expenses | `FinancialMovement` where `type = EXPENSE` |
| Partial payment tracking | Multiple `FinancialMovement` records linked to the same `Obligation` |

> Never compute "total collected" from Obligations. Never compute "debt" from FinancialMovements.

---

## 6. Backend Validation Rules

These constraints are **not enforced at the database level**. They must be implemented in the service layer (NestJS).

| Rule | Trigger | Implementation |
|---|---|---|
| `System(CUSTOM)` requires `clientId` | Create/update System | Throw `BadRequestException` if `type = CUSTOM && !clientId` |
| `Task` requires `clientId` or `systemId` | Create Task | Throw `BadRequestException` if both are null |
| `PaymentPlanItem(PERCENTAGE)` amount is 0–100 | Create/update PaymentPlanItem | Validate `0 ≤ amount ≤ 100` |
| Budget acceptance generates Obligations | Update `Budget.status = ACCEPTED` | Iterate `paymentPlanItems`, resolve amounts, create one `Obligation` per item |
| Budget is immutable after acceptance | Update Budget | Block edits if `status = ACCEPTED \| REJECTED` |
| Obligation auto-marked PAID | Create FinancialMovement | Sum all movements per obligation; if total ≥ obligation.amount, set `status = PAID` |

---

## 7. Soft Delete

Soft delete is implemented via `deletedAt DateTime?` on the following models:

| Model | Field |
|---|---|
| `Client` | `deletedAt` |
| `System` | `deletedAt` |
| `Budget` | `deletedAt` |
| `Task` | `deletedAt` |

**Implementation rules:**
- All standard queries must include `WHERE deletedAt IS NULL`.
- Deletion sets `deletedAt = NOW()`, never destroys the record.
- Soft-deleted clients retain all associated financial history.
- Admin-level queries may include soft-deleted records for audit purposes.

---

## 8. Indexes

All indexes are defined explicitly in the schema to optimize frequent query patterns.

| Model | Index | Purpose |
|---|---|---|
| `System` | `clientId` | Systems per client |
| `System` | `type` | Filter SAAS vs CUSTOM |
| `Budget` | `clientId` | Budgets per client |
| `Budget` | `status` | Pipeline filtering |
| `PaymentPlanItem` | `budgetId` | Items per budget |
| `PaymentPlanItem` | `order` | Ordered display |
| `Obligation` | `clientId` | Debt per client |
| `Obligation` | `status` | Pending debt queries |
| `Obligation` | `dueDate` | Due date alerts |
| `FinancialMovement` | `clientId` | Cash per client |
| `FinancialMovement` | `date` | Period-based queries |
| `Task` | `kanbanColumnId` | Board view |
| `Task` | `assignedToId` | My tasks view |
| `Task` | `clientId` | Client 360 view |
| `Task` | `systemId` | System task view |

---

## 9. Seed Data

The following models require seed records before the application is usable:

### `Tag`
Initial classification tags for clients. Must be defined by the system administrator.

```typescript
// Example seed
{ name: 'Enterprise', color: '#6366f1' },
{ name: 'SMB', color: '#10b981' },
{ name: 'Inactive', color: '#6b7280' },
```

### `KanbanColumn`
Columns must exist before tasks can be created.

```typescript
// MARKETING area
{ area: 'MARKETING', name: 'Backlog',      order: 1, color: '#6b7280' },
{ area: 'MARKETING', name: 'In Progress',  order: 2, color: '#3b82f6' },
{ area: 'MARKETING', name: 'Review',       order: 3, color: '#f59e0b' },
{ area: 'MARKETING', name: 'Done',         order: 4, color: '#10b981' },

// SOFTWARE area
{ area: 'SOFTWARE',  name: 'Backlog',      order: 1, color: '#6b7280' },
{ area: 'SOFTWARE',  name: 'In Progress',  order: 2, color: '#3b82f6' },
{ area: 'SOFTWARE',  name: 'Review',       order: 3, color: '#f59e0b' },
{ area: 'SOFTWARE',  name: 'Done',         order: 4, color: '#10b981' },
```

---

## 10. Technical Decisions

| Decision | Rationale |
|---|---|
| PostgreSQL | Native enum support, Decimal precision, production reliability |
| Prisma ORM | Type-safe queries, migration management, relation resolution |
| `Decimal(12,2)` for money | Avoids floating-point rounding errors on monetary values |
| `cuid()` for IDs | Collision-resistant, URL-safe, no sequential ID enumeration |
| Soft delete over hard delete | Preserves financial history, prevents orphaned records |
| Enums over strings | DB-level consistency, no invalid states possible |
| Explicit indexes | Performance on known query patterns, not auto-inferred |
| Obligations ≠ Movements | Clean separation of debt tracking and cash flow accounting |

---

## 11. Document Governance

This document must be updated whenever:
- A new model or field is added to the schema
- An enum value is added or removed
- A backend validation rule changes
- A new index is added

This document must not be modified in isolation. Changes here imply changes to:
- `prisma/schema.prisma` (source of truth)
- `01-product-decisions.md` (if business logic changes)
- Backend service layer (if validation rules change)
