# 📄 01 — Product Decisions

## 1. Introduction

This document formalizes the product decisions embedded in the AZ CRM & Product Manager system.

It is derived from — and must remain aligned with — the following artifacts:

* `prisma/schema.prisma` — source of truth for data structure
* `04-backend-modules.md` — source of truth for business logic
* `05-api-endpoints.md` — source of truth for HTTP behavior

> This document explains **why** decisions were made, not just what they are. It is the reference for product discussions, onboarding, and future feature evaluation.

---

## 2. System Scope

### Decision: Single-tenant, internal tooling

The system is built exclusively for AZ Marketing's internal use. It is not a SaaS product offered to third parties.

**Implications:**

* No tenant ID in any model
* No user self-registration
* Users created only by `SUPERADMIN`
* No public onboarding or billing flows

---

## 3. User Model

### Decision: Role and Profile are independent

```
role    → permissions
profile → user experience
```

#### Roles

| Role       | Description                                       |
| ---------- | ------------------------------------------------- |
| SUPERADMIN | Full system control (users, tags, kanban config)  |
| USER       | Full operational access (clients, tasks, finance) |

#### Profiles

| Profile   | Description         |
| --------- | ------------------- |
| MARKETER  | Marketing workflows |
| DEVELOPER | Software workflows  |

**Key Rule:**

* Profile does NOT restrict data access
* Profile ONLY affects UI

#### Authentication

* JWT-based
* Payload: `{ sub, email, role, profile }`
* No refresh tokens (MVP)
* No password recovery (MVP)

---

## 4. Client Model

### Decision: Client is the system core

All entities connect to `Client`.

#### Client Status (Derived)

| Status   | Meaning                 |
| -------- | ----------------------- |
| ACTIVE   | Healthy client          |
| INACTIVE | No current activity     |
| AT_RISK  | Has overdue obligations |

### ⚠️ Important Decision

`ClientStatus` is **DERIVED**, not manual.

**Rule:**

* If client has overdue obligations → `AT_RISK`
* Otherwise → `ACTIVE`

> The field may be stored for performance, but it must always reflect backend-calculated logic.

---

### Tags

* Controlled by system
* Managed only by `SUPERADMIN`
* Used for filtering and segmentation

---

### Soft Delete

Clients use `deletedAt`.

**Rule:**

* Deleting a client does NOT cascade
* All related data remains for audit

---

## 5. System Model

### Decision: Two system types

| Type   | Description            |
| ------ | ---------------------- |
| SAAS   | Internal product       |
| CUSTOM | Client-specific system |

### Rules

* `CUSTOM` → requires `clientId`
* `SAAS` → must NOT have `clientId`

(Enforced in backend)

---

## 6. Budget & Payment Plan

### Decision: Budget always includes payment plan

A budget is invalid without `PaymentPlanItem`.

---

### Budget Lifecycle

```
DRAFT → SENT → ACCEPTED → (generate obligations)
       → REJECTED
```

### Rules

* Only `DRAFT` can be deleted
* `ACCEPTED` / `REJECTED` are immutable

---

### Payment Plan Types

| Type       | Behavior       |
| ---------- | -------------- |
| PERCENTAGE | 0–100%         |
| FIXED      | absolute value |

### Validation

* Percentage sum must equal 100
* Fixed sum must not exceed totalAmount

---

### Constraint (Critical)

```
@@unique([budgetId, order])
```

Ensures:

* deterministic installment order
* consistent obligation generation

---

### Future Consideration

* Budget versioning (v1, v2, etc.)

---

## 7. Financial Model

### Decision: Separate debt and cash

| Concept | Model             |
| ------- | ----------------- |
| Debt    | Obligation        |
| Cash    | FinancialMovement |

---

### Obligations

* Represent accounts receivable
* Auto-generated on budget acceptance
* Status: `PENDING`, `PAID`

---

### Financial Movements

* Represent real money
* Types: `INCOME`, `EXPENSE`
* Always include payment method

---

### Partial Payments

* One obligation → multiple movements
* Supported by design

---

### ⚠️ Critical Validation Rules

#### 1. Overpayment Protection

If movement is linked to obligation:

* Sum(movements) ≤ obligation.amount

#### 2. Auto-settlement

* If sum ≥ obligation.amount → mark as `PAID`

---

### Financial Queries

| Metric  | Source             |
| ------- | ------------------ |
| Revenue | Budgets (ACCEPTED) |
| Cash    | FinancialMovements |
| Debt    | Obligations        |

---

### Transactions (Critical)

All financial operations MUST be executed in DB transactions.

---

## 8. Task Model

### Decision: Tasks require context

A task must be linked to:

* a client
* or a system
* or both

---

### Context Rule (Explicit)

A task MAY have both `clientId` and `systemId` if:

* the system belongs to that client

---

### Validation

* Reject if both are null

---

### Traceability

| Field        | Rule          |
| ------------ | ------------- |
| createdById  | From JWT only |
| assignedToId | Optional      |

---

## 9. Kanban Structure

### Decision: Separate workflows per area

| Area      | Description       |
| --------- | ----------------- |
| MARKETING | Content workflows |
| SOFTWARE  | Dev workflows     |

---

### Columns

* Defined by `SUPERADMIN`
* Not user-generated

---

### Rules

* No cross-area moves
* Cannot delete column with active tasks

---

## 10. Data Integrity

### Soft Delete Entities

* Client
* System
* Budget
* Task

---

### Behavior

* Always filter `deletedAt IS NULL`
* No cascade deletion

---

### Monetary Precision

* Use Decimal(12,2)
* Never float

---

## 11. MVP Boundaries

Out of scope:

* Refresh tokens
* Password recovery
* Pagination
* Currency conversion
* Multi-tenant
* Automated workflows (beyond obligations)

---

## 12. Governance

This document must be updated when:

* Business rules change
* Schema changes
* New entities are introduced
* MVP boundaries are expanded

---

## ✅ Final Principle

This system prioritizes:

* Simplicity
* Financial correctness
* Traceability
* Controlled flexibility

Over:

* Automation
* Complexity
* Premature scalability
