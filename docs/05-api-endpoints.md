# 📄 05 — API Endpoints (Contracts)

## 1. Introduction

This document defines the complete HTTP API contract for AZ CRM & Product Manager.

**Source of truth hierarchy:**
- `prisma/schema.prisma` — data types and structure
- `04-backend-modules.md` — business logic and service behavior
- **This document** — HTTP interface, request/response shapes, error codes

> No endpoint may be added, removed, or modified without updating this document. No implementation may deviate from the contracts defined here.

---

## 2. General Conventions

### Base URL

```
/api/v1
```

### Authentication

All endpoints require a valid JWT unless marked **Public**.

```
Authorization: Bearer <token>
```

The JWT payload contains:
```json
{
  "sub": "user_id",
  "email": "string",
  "role": "SUPERADMIN | USER",
  "profile": "MARKETER | DEVELOPER"
}
```

### Role Requirements

- `SUPERADMIN` — endpoint is restricted to SUPERADMIN role
- `Authenticated` — any valid JWT is accepted (USER or SUPERADMIN)
- `Public` — no token required

---

### Standard Response Envelope

**Success:**
```json
{
  "success": true,
  "data": {}
}
```

**Success (list):**
```json
{
  "success": true,
  "data": []
}
```

**Success (no content):**
```
HTTP 204 — empty body
```

**Error:**
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable description"
}
```

---

### HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | OK — successful GET or PATCH |
| `201` | Created — successful POST |
| `204` | No Content — successful DELETE |
| `400` | Bad Request — validation error or business rule violation |
| `401` | Unauthorized — missing or invalid token |
| `403` | Forbidden — valid token but insufficient role |
| `404` | Not Found — resource does not exist |
| `409` | Conflict — duplicate or in-use resource |

---

### Monetary Values

All monetary amounts are serialized as **strings** in responses to preserve Decimal precision.

```json
{ "totalAmount": "15000.00" }
```

Input amounts in POST/PATCH bodies are also expected as strings.

---

### Dates

All dates are ISO 8601 strings:
```
"2025-06-30T00:00:00.000Z"
```

---

### Soft-deleted records

Soft-deleted records (`deletedAt IS NOT NULL`) are excluded from all standard responses unless explicitly stated.

---

## 3. Auth

### `POST /auth/login` — Public

Authenticate a user and return a JWT access token.

**Request:**
```json
{
  "email": "admin@azmarketing.com",
  "password": "secretpassword"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "cuid",
      "email": "admin@azmarketing.com",
      "name": "Carlos",
      "role": "SUPERADMIN",
      "profile": "DEVELOPER"
    }
  }
}
```

**Errors:**
| Code | Error | Condition |
|---|---|---|
| `401` | `INVALID_CREDENTIALS` | Email not found or password does not match |

---

## 4. Users

### `GET /users` — SUPERADMIN

List all system users.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "email": "user@azmarketing.com",
      "name": "Maria",
      "role": "USER",
      "profile": "MARKETER",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

> `password` is never returned.

---

### `GET /users/me` — Authenticated

Return the authenticated user's profile.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "email": "user@azmarketing.com",
    "name": "Maria",
    "role": "USER",
    "profile": "MARKETER",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### `POST /users` — SUPERADMIN

Create a new user.

**Request:**
```json
{
  "email": "newuser@azmarketing.com",
  "name": "Juan",
  "password": "securepassword123",
  "role": "USER",
  "profile": "DEVELOPER"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | ✅ | Must be unique |
| `name` | string | ✅ | Min 2 chars |
| `password` | string | ✅ | Min 8 chars, stored as bcrypt hash |
| `role` | `Role` enum | ❌ | Default: `USER` |
| `profile` | `Profile` enum | ❌ | Default: `MARKETER` |

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "email": "newuser@azmarketing.com",
    "name": "Juan",
    "role": "USER",
    "profile": "DEVELOPER",
    "createdAt": "2025-06-01T00:00:00.000Z"
  }
}
```

**Errors:**
| Code | Error | Condition |
|---|---|---|
| `409` | `EMAIL_ALREADY_EXISTS` | Email is already registered |

---

### `PATCH /users/:id` — SUPERADMIN

Update a user's name, role, or profile. Password update is not supported via this endpoint.

**Request:**
```json
{
  "name": "Juan Updated",
  "role": "SUPERADMIN",
  "profile": "MARKETER"
}
```

All fields are optional. Only provided fields are updated.

**Response `200`:** Returns updated user (same shape as `GET /users/me`).

**Errors:**
| Code | Error | Condition |
|---|---|---|
| `404` | `USER_NOT_FOUND` | User with given ID does not exist |

---

## 5. Clients

### `GET /clients` — Authenticated

List all clients. Supports filtering.

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `status` | `ClientStatus` | Filter by `ACTIVE`, `INACTIVE`, or `AT_RISK` |
| `tagId` | string | Filter clients that have this tag |
| `search` | string | Partial match on `name`, `email`, or `company` |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "name": "Acme Corp",
      "email": "contact@acme.com",
      "phone": "+54911...",
      "company": "Acme Corp S.A.",
      "status": "ACTIVE",
      "tags": [
        { "id": "cuid", "name": "Enterprise", "color": "#6366f1" }
      ],
      "createdAt": "2025-01-15T00:00:00.000Z"
    }
  ]
}
```

---

### `GET /clients/:id` — Authenticated

Get full client detail including 360° overview.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "name": "Acme Corp",
    "email": "contact@acme.com",
    "phone": "+54911...",
    "company": "Acme Corp S.A.",
    "notes": "Internal notes...",
    "status": "ACTIVE",
    "createdAt": "2025-01-15T00:00:00.000Z",
    "tags": [
      { "id": "cuid", "name": "Enterprise", "color": "#6366f1" }
    ],
    "systems": [
      {
        "id": "cuid",
        "name": "Client Portal",
        "type": "CUSTOM",
        "status": "ACTIVE"
      }
    ],
    "financial": {
      "totalBilled": "150000.00",
      "totalCollected": "75000.00",
      "pendingDebt": "75000.00",
      "upcomingDueDates": [
        {
          "id": "cuid",
          "amount": "37500.00",
          "dueDate": "2025-07-01T00:00:00.000Z",
          "status": "PENDING"
        }
      ]
    },
    "tasks": [
      {
        "id": "cuid",
        "title": "Diseñar landing page",
        "priority": "HIGH",
        "dueDate": "2025-06-30T00:00:00.000Z",
        "kanbanColumn": { "id": "cuid", "name": "In Progress", "area": "MARKETING" }
      }
    ]
  }
}
```

**Errors:**
| Code | Error | Condition |
|---|---|---|
| `404` | `CLIENT_NOT_FOUND` | Client with given ID does not exist or is soft-deleted |

---

### `POST /clients` — Authenticated

Create a new client.

**Request:**
```json
{
  "name": "Acme Corp",
  "email": "contact@acme.com",
  "phone": "+54911...",
  "company": "Acme Corp S.A.",
  "notes": "Referred by partner",
  "status": "ACTIVE",
  "tagIds": ["cuid_tag_1", "cuid_tag_2"]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | ✅ | Min 2 chars |
| `email` | string | ❌ | Must be valid email if provided |
| `phone` | string | ❌ | — |
| `company` | string | ❌ | — |
| `notes` | string | ❌ | — |
| `status` | `ClientStatus` | ❌ | Default: `ACTIVE` |
| `tagIds` | string[] | ❌ | Must reference existing Tag IDs |

**Response `201`:** Returns created client with resolved tags.

**Errors:**
| Code | Error | Condition |
|---|---|---|
| `404` | `TAG_NOT_FOUND` | One or more `tagIds` do not exist |

---

### `PATCH /clients/:id` — Authenticated

Update a client. All fields optional.

**Request:** Same shape as `POST /clients`. Only provided fields are updated. To replace tags, provide a full `tagIds` array.

**Response `200`:** Returns updated client.

**Errors:**
| Code | Error | Condition |
|---|---|---|
| `404` | `CLIENT_NOT_FOUND` | Client does not exist |

---

### `DELETE /clients/:id` — Authenticated

Soft delete a client. Sets `deletedAt` to current timestamp.

**Response `204`:** Empty body.

**Errors:**
| Code | Error | Condition |
|---|---|---|
| `404` | `CLIENT_NOT_FOUND` | Client does not exist |

---

## 6. Tags

### `GET /tags` — Authenticated

List all available tags.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "name": "Enterprise",
      "color": "#6366f1"
    },
    {
      "id": "cuid",
      "name": "SMB",
      "color": "#10b981"
    }
  ]
}
```

---

### `POST /tags` — SUPERADMIN

Create a new tag.

**Request:**
```json
{
  "name": "VIP",
  "color": "#f59e0b"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | ✅ | Must be unique |
| `color` | string | ❌ | Hex color code |

**Response `201`:** Returns created tag.

**Errors:**
| Code | Error | Condition |
|---|---|---|
| `409` | `TAG_ALREADY_EXISTS` | Tag name is already taken |

---

### `PATCH /tags/:id` — SUPERADMIN

Update tag name or color.

**Request:**
```json
{
  "name": "Priority Client",
  "color": "#ef4444"
}
```

**Response `200`:** Returns updated tag.

---

### `DELETE /tags/:id` — SUPERADMIN

Delete a tag. Fails if the tag is currently assigned to any client.

**Response `204`:** Empty body.

**Errors:**
| Code | Error | Condition |
|---|---|---|
| `409` | `TAG_IN_USE` | Tag is assigned to one or more clients |

---

## 7. Systems

### `GET /systems` — Authenticated

List all systems.

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `type` | `SystemType` | Filter by `SAAS` or `CUSTOM` |
| `clientId` | string | Filter systems linked to a specific client |
| `status` | `SystemStatus` | Filter by `ACTIVE`, `MAINTENANCE`, or `DEPRECATED` |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "name": "AZ Pos",
      "type": "SAAS",
      "status": "ACTIVE",
      "repoUrl": "https://github.com/az/az-pos",
      "clientId": null,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### `GET /systems/:id` — Authenticated

Get system detail with active tasks.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "name": "Client Portal",
    "description": "Customer-facing portal for Acme",
    "type": "CUSTOM",
    "status": "ACTIVE",
    "repoUrl": "https://github.com/az/acme-portal",
    "client": {
      "id": "cuid",
      "name": "Acme Corp"
    },
    "tasks": [
      {
        "id": "cuid",
        "title": "Fix login bug",
        "priority": "URGENT",
        "kanbanColumn": { "name": "In Progress", "area": "SOFTWARE" }
      }
    ],
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### `POST /systems` — Authenticated

Create a new system.

**Request:**
```json
{
  "name": "Client Portal",
  "description": "Customer-facing portal",
  "type": "CUSTOM",
  "status": "ACTIVE",
  "repoUrl": "https://github.com/az/acme-portal",
  "clientId": "cuid_client"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | ✅ | — |
| `description` | string | ❌ | — |
| `type` | `SystemType` | ✅ | `SAAS` or `CUSTOM` |
| `status` | `SystemStatus` | ❌ | Default: `ACTIVE` |
| `repoUrl` | string | ❌ | Must be a valid URL if provided |
| `clientId` | string | Conditional | **Required** if `type = CUSTOM`. **Must be null** if `type = SAAS`. |

**Response `201`:** Returns created system.

**Errors:**
| Code | Error | Condition |
|---|---|---|
| `400` | `CLIENT_REQUIRED_FOR_CUSTOM` | `type = CUSTOM` but `clientId` not provided |
| `400` | `CLIENT_NOT_ALLOWED_FOR_SAAS` | `type = SAAS` but `clientId` was provided |
| `404` | `CLIENT_NOT_FOUND` | Provided `clientId` does not exist |

---

### `PATCH /systems/:id` — Authenticated

Update a system.

**Request:** Same shape as `POST /systems`. All fields optional. Business rules apply on `type`/`clientId` combination.

**Response `200`:** Returns updated system.

---

### `DELETE /systems/:id` — Authenticated

Soft delete a system.

**Response `204`:** Empty body.

---

## 8. Budgets

### `GET /budgets` — Authenticated

List all budgets.

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `clientId` | string | Filter by client |
| `status` | `BudgetStatus` | Filter by `DRAFT`, `SENT`, `ACCEPTED`, `REJECTED` |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "title": "Desarrollo Portal 2025",
      "currency": "ARS",
      "totalAmount": "150000.00",
      "status": "ACCEPTED",
      "client": {
        "id": "cuid",
        "name": "Acme Corp"
      },
      "createdAt": "2025-03-01T00:00:00.000Z"
    }
  ]
}
```

---

### `GET /budgets/:id` — Authenticated

Get budget detail including full payment plan.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "title": "Desarrollo Portal 2025",
    "description": "Includes design and development",
    "currency": "ARS",
    "totalAmount": "150000.00",
    "status": "ACCEPTED",
    "client": {
      "id": "cuid",
      "name": "Acme Corp"
    },
    "paymentPlanItems": [
      {
        "id": "cuid",
        "order": 1,
        "type": "PERCENTAGE",
        "amount": "50.00",
        "dueDate": "2025-04-01T00:00:00.000Z"
      },
      {
        "id": "cuid",
        "order": 2,
        "type": "PERCENTAGE",
        "amount": "50.00",
        "dueDate": "2025-07-01T00:00:00.000Z"
      }
    ],
    "createdAt": "2025-03-01T00:00:00.000Z"
  }
}
```

---

### `POST /budgets` — Authenticated

Create a new budget with its payment plan.

**Request:**
```json
{
  "clientId": "cuid_client",
  "title": "Desarrollo Portal 2025",
  "description": "Includes design and development",
  "currency": "ARS",
  "totalAmount": "150000.00",
  "paymentPlanItems": [
    {
      "order": 1,
      "type": "PERCENTAGE",
      "amount": "50",
      "dueDate": "2025-04-01T00:00:00.000Z"
    },
    {
      "order": 2,
      "type": "PERCENTAGE",
      "amount": "50",
      "dueDate": "2025-07-01T00:00:00.000Z"
    }
  ]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `clientId` | string | ✅ | Must reference an existing client |
| `title` | string | ✅ | — |
| `description` | string | ❌ | — |
| `currency` | `Currency` | ❌ | Default: `ARS` |
| `totalAmount` | string (Decimal) | ✅ | — |
| `paymentPlanItems` | array | ✅ | At least one item required |
| `paymentPlanItems[].order` | integer | ✅ | Unique within the budget |
| `paymentPlanItems[].type` | `PaymentPlanType` | ✅ | `PERCENTAGE` or `FIXED` |
| `paymentPlanItems[].amount` | string (Decimal) | ✅ | 0–100 if PERCENTAGE; real value if FIXED |
| `paymentPlanItems[].dueDate` | ISO date | ✅ | — |

**Response `201`:** Returns created budget with payment plan items.

**Errors:**
| Code | Error | Condition |
|---|---|---|
| `404` | `CLIENT_NOT_FOUND` | Provided `clientId` does not exist |
| `400` | `PERCENTAGE_MUST_SUM_100` | All items are `PERCENTAGE` but do not sum to 100 |
| `400` | `FIXED_EXCEEDS_TOTAL` | Sum of `FIXED` items exceeds `totalAmount` |
| `400` | `PERCENTAGE_OUT_OF_RANGE` | A `PERCENTAGE` item has `amount` outside 0–100 |

---

### `PATCH /budgets/:id/status` — Authenticated

Transition a budget to a new status.

**Request:**
```json
{
  "status": "ACCEPTED"
}
```

| Value | Effect |
|---|---|
| `SENT` | Marks budget as delivered to client |
| `ACCEPTED` | **Triggers automatic Obligation generation** |
| `REJECTED` | Closes the budget as rejected |

> Once a budget is `ACCEPTED` or `REJECTED`, it cannot be modified or transitioned again.

**Response `200`:** Returns updated budget.

**Errors:**
| Code | Error | Condition |
|---|---|---|
| `400` | `BUDGET_ALREADY_CLOSED` | Budget is already `ACCEPTED` or `REJECTED` |
| `404` | `BUDGET_NOT_FOUND` | Budget does not exist |

---

### `DELETE /budgets/:id` — Authenticated

Soft delete a budget. Only allowed when `status = DRAFT`.

**Response `204`:** Empty body.

**Errors:**
| Code | Error | Condition |
|---|---|---|
| `400` | `BUDGET_NOT_DELETABLE` | Budget is not in `DRAFT` status |
| `404` | `BUDGET_NOT_FOUND` | Budget does not exist |

---

## 9. Obligations

> All obligation routes are nested under `/financial`.

### `GET /financial/obligations` — Authenticated

List obligations with optional filters.

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `clientId` | string | Filter by client |
| `status` | `ObligationStatus` | Filter by `PENDING` or `PAID` |
| `dueBefore` | ISO date | Return obligations due before this date |
| `budgetId` | string | Filter obligations linked to a specific budget |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "amount": "75000.00",
      "currency": "ARS",
      "dueDate": "2025-07-01T00:00:00.000Z",
      "status": "PENDING",
      "clientId": "cuid",
      "budgetId": "cuid",
      "paymentPlanItemId": null,
      "client": { "id": "cuid", "name": "Acme Corp" },
      "createdAt": "2025-03-01T00:00:00.000Z"
    }
  ]
}
```

---

### `GET /financial/obligations/:id` — Authenticated

Get obligation detail with all linked financial movements, plus computed `totalPaid` and `remaining`.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "amount": "75000.00",
    "currency": "ARS",
    "dueDate": "2025-07-01T00:00:00.000Z",
    "status": "PENDING",
    "client": { "id": "cuid", "name": "Acme Corp" },
    "budget": { "id": "cuid", "title": "Desarrollo Portal 2025", "status": "ACCEPTED" },
    "movements": [
      {
        "id": "cuid",
        "type": "INCOME",
        "amount": "30000.00",
        "currency": "ARS",
        "paymentMethod": "TRANSFER",
        "date": "2025-06-01T00:00:00.000Z",
        "description": "Primer pago portal",
        "createdAt": "2025-06-01T10:30:00.000Z"
      }
    ],
    "totalPaid": "30000.00",
    "remaining": "45000.00"
  }
}
```

> `remaining` is clamped to `0` — never negative.

**Errors:**
| Code | Error | Condition |
|---|---|---|
| `404` | `OBLIGATION_NOT_FOUND` | Obligation does not exist |

---

### `POST /financial/obligations` — Authenticated

Create a manual obligation (not auto-generated from a budget).

**Request:**
```json
{
  "clientId": "cuid_client",
  "amount": "25000.00",
  "currency": "ARS",
  "dueDate": "2025-08-01T00:00:00.000Z",
  "budgetId": "optional_cuid"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `clientId` | string | ✅ | Must reference an existing, non-deleted client |
| `amount` | string (Decimal) | ✅ | Positive number, up to 2 decimal places |
| `currency` | `Currency` | ❌ | Default: `ARS` |
| `dueDate` | ISO date | ✅ | — |
| `budgetId` | string | ❌ | Optional link to a budget for traceability |

**Response `201`:** Returns created obligation with full detail shape.

**Errors:**
| Code | Error | Condition |
|---|---|---|
| `404` | `CLIENT_NOT_FOUND` | Provided `clientId` does not exist or is soft-deleted |
| `404` | `BUDGET_NOT_FOUND` | Provided `budgetId` does not exist |

---

### `PATCH /financial/obligations/:id` — Authenticated

Update an obligation. Only allowed when `status = PENDING`.

**Request:**
```json
{
  "amount": "80000.00",
  "currency": "USD",
  "dueDate": "2025-09-01T00:00:00.000Z"
}
```

All fields optional. Only provided fields are updated.

**Response `200`:** Returns updated obligation with full detail shape.

**Errors:**
| Code | Error | Condition |
|---|---|---|
| `400` | `OBLIGATION_ALREADY_PAID` | Obligation status is `PAID` — mutation not allowed |
| `404` | `OBLIGATION_NOT_FOUND` | Obligation does not exist |

---

### `DELETE /financial/obligations/:id` — Authenticated

Hard delete an obligation. Subject to strict guards.

**Response `204`:** Empty body.

**Errors:**
| Code | Error | Condition |
|---|---|---|
| `400` | `OBLIGATION_ALREADY_PAID` | Obligation is `PAID` |
| `400` | `OBLIGATION_GENERATED_FROM_BUDGET` | Obligation was auto-generated from a budget (`paymentPlanItemId` is set) |
| `400` | `OBLIGATION_HAS_MOVEMENTS` | Obligation has linked financial movements |
| `404` | `OBLIGATION_NOT_FOUND` | Obligation does not exist |

---

## 10. Financial Movements

> All movement routes are nested under `/financial`.

### `GET /financial/movements` — Authenticated

List financial movements.

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `clientId` | string | Filter by client |
| `type` | `MovementType` | Filter by `INCOME` or `EXPENSE` |
| `from` | ISO date | Start of date range (inclusive) |
| `to` | ISO date | End of date range (inclusive) |
| `obligationId` | string | Filter movements linked to a specific obligation |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "type": "INCOME",
      "amount": "30000.00",
      "currency": "ARS",
      "paymentMethod": "TRANSFER",
      "date": "2025-06-01T00:00:00.000Z",
      "description": "Primer pago portal",
      "clientId": "cuid",
      "obligationId": "cuid",
      "client": { "id": "cuid", "name": "Acme Corp" },
      "obligation": { "id": "cuid", "amount": "75000.00", "status": "PENDING" },
      "createdAt": "2025-06-01T10:30:00.000Z"
    }
  ]
}
```

---

### `GET /financial/movements/:id` — Authenticated

Get a single movement by ID.

**Response `200`:** Returns the movement with the same shape as the list item above.

**Errors:**
| Code | Error | Condition |
|---|---|---|
| `404` | `MOVEMENT_NOT_FOUND` | Movement does not exist |

---

### `POST /financial/movements` — Authenticated

Register a new financial movement.

**Request:**
```json
{
  "type": "INCOME",
  "amount": "30000.00",
  "currency": "ARS",
  "paymentMethod": "TRANSFER",
  "date": "2025-06-01T00:00:00.000Z",
  "description": "Primer pago portal",
  "clientId": "cuid_client",
  "obligationId": "cuid_obligation"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | `MovementType` | ✅ | `INCOME` or `EXPENSE` |
| `amount` | string (Decimal) | ✅ | Positive number, up to 2 decimal places |
| `currency` | `Currency` | ❌ | Default: `ARS` |
| `paymentMethod` | `PaymentMethod` | ✅ | `CASH`, `TRANSFER`, `CARD`, `OTHER` |
| `date` | ISO date | ✅ | Real transaction date (distinct from `createdAt`) |
| `description` | string | ❌ | — |
| `clientId` | string | ❌ | Optional — `EXPENSE` movements may have no client |
| `obligationId` | string | ❌ | If provided, obligation's paid total is recalculated after creation |

**Response `201`:** Returns created movement. If `obligationId` was provided and the total paid now equals or exceeds the obligation's amount, the obligation `status` is automatically set to `PAID`.

**Errors:**
| Code | Error | Condition |
|---|---|---|
| `404` | `CLIENT_NOT_FOUND` | Provided `clientId` does not exist or is soft-deleted |
| `404` | `OBLIGATION_NOT_FOUND` | Provided `obligationId` does not exist |
| `400` | `OBLIGATION_ALREADY_PAID` | Linked obligation is already `PAID` |

---

### `PATCH /financial/movements/:id` — Authenticated

Update a movement. If `amount` changes and the movement is linked to an obligation, the obligation status is re-evaluated within a transaction.

**Request:**
```json
{
  "amount": "35000.00",
  "paymentMethod": "CASH",
  "description": "Corrected amount"
}
```

All fields optional. Only provided fields are updated.

**Response `200`:** Returns updated movement.

**Errors:**
| Code | Error | Condition |
|---|---|---|
| `404` | `MOVEMENT_NOT_FOUND` | Movement does not exist |

---

### `DELETE /financial/movements/:id` — Authenticated

Hard delete a movement. If the movement was linked to a `PAID` obligation and removing it causes the total paid to drop below the obligation amount, the obligation is automatically reverted to `PENDING`.

**Response `204`:** Empty body.

**Errors:**
| Code | Error | Condition |
|---|---|---|
| `404` | `MOVEMENT_NOT_FOUND` | Movement does not exist |

---

## 11. Tasks

### `GET /tasks` — Authenticated

List tasks with optional filters.

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `clientId` | string | Tasks linked to a specific client |
| `systemId` | string | Tasks linked to a specific system |
| `assignedToId` | string | Tasks assigned to a specific user |
| `kanbanColumnId` | string | Tasks in a specific column |
| `priority` | `TaskPriority` | Filter by priority |
| `dueBefore` | ISO date | Return tasks with dueDate on or before this date |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "title": "Diseñar landing page",
      "description": "Landing for Q3 campaign",
      "priority": "HIGH",
      "dueDate": "2025-06-30T00:00:00.000Z",
      "kanbanColumn": {
        "id": "cuid",
        "name": "In Progress",
        "area": "MARKETING"
      },
      "client": { "id": "cuid", "name": "Acme Corp" },
      "system": null,
      "assignedTo": { "id": "cuid", "name": "Maria" },
      "createdBy": { "id": "cuid", "name": "Carlos" },
      "createdAt": "2025-05-01T00:00:00.000Z"
    }
  ]
}
```

---

### `GET /tasks/:id` — Authenticated

Get task detail.

**Response `200`:** Same shape as list item above (single object under `data`).

---

### `POST /tasks` — Authenticated

Create a new task.

**Request:**
```json
{
  "title": "Diseñar landing page",
  "description": "Landing for Q3 campaign",
  "priority": "HIGH",
  "dueDate": "2025-06-30T00:00:00.000Z",
  "kanbanColumnId": "cuid_column",
  "clientId": "cuid_client",
  "systemId": null,
  "assignedToId": "cuid_user"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | ✅ | — |
| `description` | string | ❌ | — |
| `priority` | `TaskPriority` | ❌ | Default: `MEDIUM` |
| `dueDate` | ISO date | ❌ | — |
| `kanbanColumnId` | string | ✅ | Must reference an existing column |
| `clientId` | string | Conditional | At least one of `clientId` or `systemId` required |
| `systemId` | string | Conditional | At least one of `clientId` or `systemId` required |
| `assignedToId` | string | ❌ | — |

> `createdById` is set automatically from the authenticated JWT. It is not accepted in the request body.

**Response `201`:** Returns created task.

**Errors:**
| Code | Error | Condition |
|---|---|---|
| `400` | `TASK_REQUIRES_CLIENT_OR_SYSTEM` | Both `clientId` and `systemId` are null |
| `400` | `DUE_DATE_MUST_BE_FUTURE` | `dueDate` is not in the future |
| `404` | `KANBAN_COLUMN_NOT_FOUND` | `kanbanColumnId` does not exist |
| `404` | `CLIENT_NOT_FOUND` | `clientId` does not exist or is soft-deleted |
| `404` | `SYSTEM_NOT_FOUND` | `systemId` does not exist or is soft-deleted |
| `404` | `ASSIGNED_USER_NOT_FOUND` | `assignedToId` does not exist |

---

### `PATCH /tasks/:id` — Authenticated

Update task fields. If both `clientId` and `systemId` would become null after the update, the request is rejected.

**Request:** All fields optional.
```json
{
  "title": "Diseñar landing page v2",
  "priority": "URGENT",
  "kanbanColumnId": "cuid_new_column",
  "assignedToId": "cuid_other_user"
}
```

**Response `200`:** Returns updated task.

**Errors:**
| Code | Error | Condition |
|---|---|---|
| `400` | `TASK_REQUIRES_CLIENT_OR_SYSTEM` | Update would leave both `clientId` and `systemId` as null |
| `400` | `DUE_DATE_MUST_BE_FUTURE` | `dueDate` is not in the future |
| `404` | `TASK_NOT_FOUND` | Task does not exist or is soft-deleted |
| `404` | `KANBAN_COLUMN_NOT_FOUND` | `kanbanColumnId` does not exist |

---

### `DELETE /tasks/:id` — Authenticated

Soft delete a task.

**Response `204`:** Empty body.

---

## 12. Kanban Columns

### `GET /kanban-columns` — Authenticated

List kanban columns, optionally filtered by area. Ordered by `area` then `order`.

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `area` | `KanbanArea` | Filter by `MARKETING` or `SOFTWARE` |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "name": "Backlog",
      "area": "MARKETING",
      "order": 1,
      "color": "#6b7280"
    },
    {
      "id": "cuid",
      "name": "In Progress",
      "area": "MARKETING",
      "order": 2,
      "color": "#3b82f6"
    }
  ]
}
```

---

### `GET /kanban-columns/:id` — Authenticated

Get a single kanban column including its active (non-soft-deleted) tasks.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "name": "In Progress",
    "area": "MARKETING",
    "order": 2,
    "color": "#3b82f6",
    "tasks": [
      {
        "id": "cuid",
        "title": "Diseñar landing page",
        "priority": "HIGH",
        "dueDate": "2025-06-30T00:00:00.000Z",
        "client": { "id": "cuid", "name": "Acme Corp" },
        "system": null,
        "assignedTo": { "id": "cuid", "name": "Maria" },
        "createdAt": "2025-05-01T00:00:00.000Z"
      }
    ]
  }
}
```

**Errors:**
| Code | Error | Condition |
|---|---|---|
| `404` | `KANBAN_COLUMN_NOT_FOUND` | Column does not exist |

---

### `POST /kanban-columns` — SUPERADMIN

Create a new kanban column.

**Request:**
```json
{
  "name": "Testing",
  "area": "SOFTWARE",
  "order": 3,
  "color": "#a855f7"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | ✅ | Must be unique within the area |
| `area` | `KanbanArea` | ✅ | `MARKETING` or `SOFTWARE` |
| `order` | integer | ✅ | Must be unique within the area |
| `color` | string | ❌ | Hex color code |

**Response `201`:** Returns created column.

**Errors:**
| Code | Error | Condition |
|---|---|---|
| `409` | `COLUMN_NAME_OR_ORDER_ALREADY_EXISTS_IN_AREA` | A column with the same name or order already exists in this area |

---

### `PATCH /kanban-columns/:id` — SUPERADMIN

Update column name, order, or color. Uniqueness rules apply.

**Request:**
```json
{
  "name": "QA Testing",
  "order": 4,
  "color": "#8b5cf6"
}
```

**Response `200`:** Returns updated column.

**Errors:**
| Code | Error | Condition |
|---|---|---|
| `404` | `KANBAN_COLUMN_NOT_FOUND` | Column does not exist |
| `409` | `COLUMN_NAME_OR_ORDER_ALREADY_EXISTS_IN_AREA` | Name or order conflicts with an existing column in this area |

---

### `DELETE /kanban-columns/:id` — SUPERADMIN

Hard delete a kanban column. `KanbanColumn` has no `deletedAt` — this is a permanent deletion.

**Response `204`:** Empty body.

**Errors:**
| Code | Error | Condition |
|---|---|---|
| `400` | `COLUMN_HAS_ACTIVE_TASKS` | Column still contains active (non-soft-deleted) tasks |
| `404` | `KANBAN_COLUMN_NOT_FOUND` | Column does not exist |

---

## 13. Business Rules Summary

| Rule | Endpoint | Error Code |
|---|---|---|
| `CUSTOM` system requires `clientId` | `POST /systems`, `PATCH /systems/:id` | `CLIENT_REQUIRED_FOR_CUSTOM` |
| `SAAS` system must not have `clientId` | `POST /systems`, `PATCH /systems/:id` | `CLIENT_NOT_ALLOWED_FOR_SAAS` |
| Task requires `clientId` or `systemId` | `POST /tasks`, `PATCH /tasks/:id` | `TASK_REQUIRES_CLIENT_OR_SYSTEM` |
| Task `dueDate` must be in the future | `POST /tasks`, `PATCH /tasks/:id` | `DUE_DATE_MUST_BE_FUTURE` |
| `PERCENTAGE` amount must be 0–100 | `POST /budgets` | `PERCENTAGE_OUT_OF_RANGE` |
| PERCENTAGE items must sum to 100 | `POST /budgets` | `PERCENTAGE_MUST_SUM_100` |
| FIXED items must not exceed `totalAmount` | `POST /budgets` | `FIXED_EXCEEDS_TOTAL` |
| Budget acceptance auto-generates obligations | `PATCH /budgets/:id/status` | — (automation) |
| Budget is immutable once ACCEPTED or REJECTED | `PATCH /budgets/:id/status`, `DELETE /budgets/:id` | `BUDGET_ALREADY_CLOSED`, `BUDGET_NOT_DELETABLE` |
| Budget delete only allowed in `DRAFT` | `DELETE /budgets/:id` | `BUDGET_NOT_DELETABLE` |
| Payment to obligation auto-marks PAID | `POST /financial/movements` | — (automation) |
| Removing a movement can revert obligation to PENDING | `DELETE /financial/movements/:id` | — (automation) |
| Obligation update/delete blocked when PAID | `PATCH /financial/obligations/:id`, `DELETE /financial/obligations/:id` | `OBLIGATION_ALREADY_PAID` |
| Obligation delete blocked when budget-generated | `DELETE /financial/obligations/:id` | `OBLIGATION_GENERATED_FROM_BUDGET` |
| Obligation delete blocked when has movements | `DELETE /financial/obligations/:id` | `OBLIGATION_HAS_MOVEMENTS` |
| Kanban column delete blocked with active tasks | `DELETE /kanban-columns/:id` | `COLUMN_HAS_ACTIVE_TASKS` |
| Tag delete blocked when assigned to clients | `DELETE /tags/:id` | `TAG_IN_USE` |

---

## 14. Complete Data Flow Reference

### Commercial Flow
```
POST /clients
  → POST /budgets        (with paymentPlanItems)
  → PATCH /budgets/:id/status { status: "ACCEPTED" }
      └─ auto → POST /obligations (one per paymentPlanItem)
```

### Financial Flow
```
POST /financial-movements { obligationId, amount }
  → links movement to obligation
  → if totalPaid >= obligation.amount → obligation.status = "PAID"
```

### Operational Flow
```
POST /tasks { kanbanColumnId, clientId or systemId }
  → PATCH /tasks/:id { kanbanColumnId }   (column change within same area enforced in service)
  → PATCH /tasks/:id { assignedToId, priority }
  → DELETE /tasks/:id  (soft delete)
```
