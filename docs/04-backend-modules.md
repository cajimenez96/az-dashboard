# 📄 04 — Backend Architecture (NestJS)

## 1. Introduction

This document defines the complete backend architecture for AZ CRM & Product Manager using NestJS.

**Stack:**
- Framework: NestJS (TypeScript)
- ORM: Prisma Client
- Auth: JWT (access token, stateless)
- Validation: `class-validator` + `class-transformer`
- Database: PostgreSQL (see `03-database-schema.md`)

> This document is the reference for module implementation. It must remain aligned with `prisma/schema.prisma` and `01-product-decisions.md`.

---

## 2. Architectural Principles

- **Feature-based modules** — each module owns its domain completely.
- **Thin controllers** — controllers only handle HTTP concerns (parsing, routing, response codes). No business logic.
- **Service layer owns business logic** — all rules, validations, and automations live in services.
- **Prisma is the data layer** — services call Prisma directly. No repository pattern needed at this scale.
- **DTOs are the contract** — all input is validated through DTOs using `class-validator` before reaching services.
- **Guards are the gatekeepers** — authentication and authorization are enforced via NestJS guards, not inside services.

---

## 3. Project Structure

```
src/
├── main.ts
├── app.module.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── common/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts
│   └── pipes/
│       └── validation.pipe.ts
├── auth/
├── users/
├── clients/
├── tags/
├── systems/
├── budgets/
├── payment-plan/
├── obligations/
├── financial/
├── tasks/
└── kanban/
```

### Module internal structure (per feature)

```
<module>/
├── <module>.module.ts
├── <module>.controller.ts
├── <module>.service.ts
└── dto/
    ├── create-<module>.dto.ts
    ├── update-<module>.dto.ts
    └── (query-<module>.dto.ts if needed)
```

---

## 4. Shared Infrastructure

### 4.1 PrismaModule

Global module. Provides `PrismaService` to all modules.

```typescript
// prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

`PrismaModule` is declared `@Global()` — no need to import it per module.

---

### 4.2 JwtAuthGuard

Applied globally via `APP_GUARD` provider. All routes require a valid JWT by default.

```typescript
// Applied at app level — all routes are protected unless decorated with @Public()
providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }]
```

Use `@Public()` decorator to exempt specific routes (e.g., `POST /auth/login`).

---

### 4.3 RolesGuard

Applied where role-based access is required. Used together with `@Roles()` decorator.

```typescript
@Roles(Role.SUPERADMIN)
@Get('admin-only')
```

In MVP, most endpoints are accessible to all authenticated users. `SUPERADMIN` restrictions are applied only where documented.

---

### 4.4 CurrentUser Decorator

Extracts the authenticated user from the JWT payload, injected into controllers.

```typescript
@Get('me')
getProfile(@CurrentUser() user: JwtPayload) { ... }
```

`JwtPayload` shape:
```typescript
{
  sub: string;    // user.id
  email: string;
  role: Role;
  profile: Profile;
}
```

---

## 5. Modules

---

### 5.1 AuthModule

**Responsibility:** Authenticate users and issue JWT access tokens.

**Dependencies:** `UserModule`, `JwtModule`, `BcryptService` (internal)

#### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Authenticate and return JWT |

#### `POST /auth/login`

**Request DTO:**
```typescript
class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

**Response:**
```json
{
  "access_token": "eyJhbGci...",
  "user": {
    "id": "...",
    "email": "...",
    "name": "...",
    "role": "USER",
    "profile": "MARKETER"
  }
}
```

**Service logic:**
1. Find user by email — throw `UnauthorizedException` if not found.
2. Compare password with stored hash using `bcrypt.compare`.
3. Throw `UnauthorizedException` if password does not match.
4. Sign and return JWT with payload `{ sub, email, role, profile }`.

**Notes:**
- No refresh tokens in MVP. Token expiry is configurable via env (`JWT_EXPIRES_IN`).
- Password recovery is out of scope for MVP.

---

### 5.2 UserModule

**Responsibility:** Manage internal system users.

**Dependencies:** `PrismaModule`

#### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/users` | SUPERADMIN | List all users |
| `GET` | `/users/me` | Authenticated | Get current user profile |
| `POST` | `/users` | SUPERADMIN | Create a new user |
| `PATCH` | `/users/:id` | SUPERADMIN | Update user data |

#### DTOs

**`CreateUserDto`**
```typescript
class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role; // default: USER

  @IsEnum(Profile)
  @IsOptional()
  profile?: Profile; // default: MARKETER
}
```

**`UpdateUserDto`** — `PartialType(CreateUserDto)` excluding `password`.

#### Service logic

- `create`: hash password with `bcrypt` before saving.
- `findAll`: returns users without `password` field.
- `findMe`: returns current user from JWT sub.
- `update`: SUPERADMIN only; cannot update own role.

---

### 5.3 ClientModule

**Responsibility:** Full management of clients. Central entity of the system.

**Dependencies:** `PrismaModule`

#### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/clients` | Authenticated | List clients (with filters) |
| `GET` | `/clients/:id` | Authenticated | Get single client |
| `GET` | `/clients/:id/overview` | Authenticated | Client 360° view |
| `POST` | `/clients` | Authenticated | Create client |
| `PATCH` | `/clients/:id` | Authenticated | Update client |
| `DELETE` | `/clients/:id` | Authenticated | Soft delete client |

#### DTOs

**`CreateClientDto`**
```typescript
class CreateClientDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(ClientStatus)
  @IsOptional()
  status?: ClientStatus; // default: ACTIVE

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tagIds?: string[];
}
```

**`QueryClientDto`**
```typescript
class QueryClientDto {
  @IsEnum(ClientStatus)
  @IsOptional()
  status?: ClientStatus;

  @IsString()
  @IsOptional()
  tagId?: string;

  @IsString()
  @IsOptional()
  search?: string; // matches name, email, company
}
```

#### Service logic

- **`findAll`**: filters by `status`, `tagId`, and `search`. Always excludes `deletedAt IS NOT NULL`.
- **`findOne`**: includes tags, active systems, and open obligations count.
- **`overview`**: returns aggregated data for the 360° view (see section 5.3.1).
- **`create`**: creates client, then creates `ClientTag` records for each `tagId`.
- **`update`**: supports updating tags (replace full tag set).
- **`remove`**: sets `deletedAt = new Date()`. Does not delete associated records.

#### 5.3.1 Client 360° Overview (`GET /clients/:id/overview`)

Returns a complete snapshot for the client dashboard view.

```typescript
{
  client: Client,          // base data + tags
  systems: System[],       // active systems (deletedAt IS NULL)
  financial: {
    totalBilled: Decimal,  // sum of Budget.totalAmount where status = ACCEPTED
    totalCollected: Decimal, // sum of FinancialMovement.amount where type = INCOME
    pendingDebt: Decimal,  // sum of Obligation.amount where status = PENDING
    upcomingDueDates: Obligation[], // PENDING, ordered by dueDate ASC, limit 5
  },
  tasks: {
    active: Task[],        // tasks where deletedAt IS NULL
  },
  healthStatus: ClientStatus // derived or stored
}
```

---

### 5.4 TagModule

**Responsibility:** Manage controlled classification tags.

**Dependencies:** `PrismaModule`

#### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/tags` | Authenticated | List all tags |
| `POST` | `/tags` | SUPERADMIN | Create a tag |
| `PATCH` | `/tags/:id` | SUPERADMIN | Update a tag |
| `DELETE` | `/tags/:id` | SUPERADMIN | Delete a tag |

#### DTOs

**`CreateTagDto`**
```typescript
class CreateTagDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsHexColor()
  @IsOptional()
  color?: string;
}
```

#### Service logic

- Tags are system-defined, not user-created. Only `SUPERADMIN` can create/update/delete.
- `delete`: check if any clients reference this tag before deleting. Throw `ConflictException` if in use, or cascade depending on product decision.
- `findAll`: returns all tags with client count.

---

### 5.5 SystemModule

**Responsibility:** Manage systems and projects (SAAS and CUSTOM).

**Dependencies:** `PrismaModule`

#### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/systems` | Authenticated | List all systems (with filters) |
| `GET` | `/systems/:id` | Authenticated | Get system detail |
| `POST` | `/systems` | Authenticated | Create system |
| `PATCH` | `/systems/:id` | Authenticated | Update system |
| `DELETE` | `/systems/:id` | Authenticated | Soft delete system |

#### DTOs

**`CreateSystemDto`**
```typescript
class CreateSystemDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(SystemType)
  type: SystemType;

  @IsEnum(SystemStatus)
  @IsOptional()
  status?: SystemStatus;

  @IsUrl()
  @IsOptional()
  repoUrl?: string;

  @IsString()
  @IsOptional()
  clientId?: string;
}
```

#### Service logic

**`create` — business rule:**
```typescript
if (dto.type === SystemType.CUSTOM && !dto.clientId) {
  throw new BadRequestException('CUSTOM systems must have a clientId');
}
if (dto.type === SystemType.SAAS && dto.clientId) {
  throw new BadRequestException('SAAS systems must not have a clientId');
}
```

- **`findAll`**: supports filter by `type`, `clientId`, `status`. Excludes soft-deleted.
- **`remove`**: soft delete via `deletedAt`.

---

### 5.6 BudgetModule

**Responsibility:** Manage commercial proposals and trigger obligation generation on acceptance.

**Dependencies:** `PrismaModule`, `ObligationModule` (for auto-generation)

#### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/budgets` | Authenticated | List budgets (with filters) |
| `GET` | `/budgets/:id` | Authenticated | Get budget with payment plan |
| `POST` | `/budgets` | Authenticated | Create budget with payment plan |
| `PATCH` | `/budgets/:id/status` | Authenticated | Update budget status |
| `DELETE` | `/budgets/:id` | Authenticated | Soft delete (DRAFT only) |

#### DTOs

**`CreateBudgetDto`**
```typescript
class PaymentPlanItemDto {
  @IsInt()
  @Min(1)
  order: number;

  @IsDecimal()
  amount: string; // Decimal as string for precision

  @IsEnum(PaymentPlanType)
  type: PaymentPlanType;

  @IsDateString()
  dueDate: string;
}

class CreateBudgetDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency; // default: ARS

  @IsDecimal()
  totalAmount: string;

  @IsString()
  clientId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentPlanItemDto)
  paymentPlanItems: PaymentPlanItemDto[];
}
```

**`UpdateBudgetStatusDto`**
```typescript
class UpdateBudgetStatusDto {
  @IsEnum(BudgetStatus)
  status: BudgetStatus;
}
```

#### Service logic

**`create`:**
1. Create `Budget` record.
2. Create all `PaymentPlanItem` records linked to the budget.
3. Validate PERCENTAGE items sum to 100 (if all items are PERCENTAGE).
4. Validate FIXED items sum does not exceed `totalAmount`.
5. Return budget with items.

**`updateStatus` — budget acceptance automation:**
```typescript
async updateStatus(id: string, dto: UpdateBudgetStatusDto) {
  const budget = await this.prisma.budget.findUniqueOrThrow({ where: { id } });

  if (budget.status === BudgetStatus.ACCEPTED || budget.status === BudgetStatus.REJECTED) {
    throw new BadRequestException('Budget is already closed and cannot be modified');
  }

  const updated = await this.prisma.budget.update({
    where: { id },
    data: { status: dto.status },
    include: { paymentPlanItems: true },
  });

  if (dto.status === BudgetStatus.ACCEPTED) {
    await this.obligationService.createFromBudget(updated);
  }

  return updated;
}
```

**`remove`:** Only allowed when `status = DRAFT`. Throws `BadRequestException` otherwise.

---

### 5.7 PaymentPlanModule

**Responsibility:** Manage payment plan items of a budget.

**Scope:** No independent HTTP endpoints in MVP. Logic is managed entirely within `BudgetModule`.

**Service is injected into `BudgetModule` for validation:**
- `validatePercentageItems(items)` — ensures sum equals 100.
- `validateFixedItems(items, totalAmount)` — ensures total does not exceed budget amount.
- `resolveAmount(item, totalAmount)` — converts PERCENTAGE to real Decimal value.

```typescript
resolveAmount(item: PaymentPlanItem, totalAmount: Decimal): Decimal {
  if (item.type === PaymentPlanType.PERCENTAGE) {
    return totalAmount.mul(item.amount).div(100);
  }
  return item.amount;
}
```

---

### 5.8 ObligationModule

**Responsibility:** Track client debt and manage payment state.

**Dependencies:** `PrismaModule`

#### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/obligations` | Authenticated | List obligations (with filters) |
| `GET` | `/obligations/:id` | Authenticated | Get obligation with movements |
| `POST` | `/obligations` | Authenticated | Create manual obligation |
| `PATCH` | `/obligations/:id/status` | Authenticated | Mark as PAID manually |

#### DTOs

**`CreateObligationDto`** (for manual obligations)
```typescript
class CreateObligationDto {
  @IsString()
  clientId: string;

  @IsString()
  @IsOptional()
  budgetId?: string;

  @IsDecimal()
  amount: string;

  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @IsDateString()
  dueDate: string;
}
```

**`QueryObligationDto`**
```typescript
class QueryObligationDto {
  @IsString()
  @IsOptional()
  clientId?: string;

  @IsEnum(ObligationStatus)
  @IsOptional()
  status?: ObligationStatus;

  @IsDateString()
  @IsOptional()
  dueBefore?: string;
}
```

#### Service logic

**`createFromBudget(budget)` — called by BudgetService on acceptance:**
```typescript
async createFromBudget(budget: Budget & { paymentPlanItems: PaymentPlanItem[] }) {
  const obligations = budget.paymentPlanItems.map((item) => ({
    clientId:          budget.clientId,
    budgetId:          budget.id,
    paymentPlanItemId: item.id,
    currency:          budget.currency,
    amount:            this.paymentPlanService.resolveAmount(item, budget.totalAmount),
    dueDate:           item.dueDate,
    status:            ObligationStatus.PENDING,
  }));

  await this.prisma.obligation.createMany({ data: obligations });
}
```

**`checkAndMarkPaid(obligationId)` — called by FinancialModule after each movement:**
```typescript
async checkAndMarkPaid(obligationId: string) {
  const obligation = await this.prisma.obligation.findUnique({
    where: { id: obligationId },
    include: { movements: true },
  });

  const totalPaid = obligation.movements.reduce((sum, m) => sum.add(m.amount), new Decimal(0));

  if (totalPaid.gte(obligation.amount)) {
    await this.prisma.obligation.update({
      where: { id: obligationId },
      data: { status: ObligationStatus.PAID },
    });
  }
}
```

---

### 5.9 FinancialModule

**Responsibility:** Record and query real cash transactions (income and expenses).

**Dependencies:** `PrismaModule`, `ObligationModule`

#### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/financial` | Authenticated | List movements (with filters) |
| `GET` | `/financial/summary` | Authenticated | Aggregated totals |
| `POST` | `/financial` | Authenticated | Register a movement |

#### DTOs

**`CreateFinancialMovementDto`**
```typescript
class CreateFinancialMovementDto {
  @IsEnum(MovementType)
  type: MovementType;

  @IsDecimal()
  amount: string;

  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsDateString()
  date: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  obligationId?: string;
}
```

**`QueryFinancialDto`**
```typescript
class QueryFinancialDto {
  @IsEnum(MovementType)
  @IsOptional()
  type?: MovementType;

  @IsString()
  @IsOptional()
  clientId?: string;

  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;
}
```

#### Service logic

**`create`:**
1. Create `FinancialMovement` record.
2. If `obligationId` is set, call `obligationService.checkAndMarkPaid(obligationId)`.
3. Return the created movement.

**`getSummary(query)`:**
```typescript
{
  totalIncome:  // sum of INCOME movements in range
  totalExpense: // sum of EXPENSE movements in range
  balance:      // totalIncome - totalExpense
}
```

---

### 5.10 TaskModule

**Responsibility:** Manage work units within the kanban board.

**Dependencies:** `PrismaModule`

#### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/tasks` | Authenticated | List tasks (with filters) |
| `GET` | `/tasks/:id` | Authenticated | Get task detail |
| `POST` | `/tasks` | Authenticated | Create task |
| `PATCH` | `/tasks/:id` | Authenticated | Update task |
| `PATCH` | `/tasks/:id/move` | Authenticated | Move to different kanban column |
| `DELETE` | `/tasks/:id` | Authenticated | Soft delete task |

#### DTOs

**`CreateTaskDto`**
```typescript
class CreateTaskDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority; // default: MEDIUM

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  kanbanColumnId: string;

  @IsString()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  systemId?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;
}
```

**`MoveTaskDto`**
```typescript
class MoveTaskDto {
  @IsString()
  kanbanColumnId: string;
}
```

**`QueryTaskDto`**
```typescript
class QueryTaskDto {
  @IsString()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  systemId?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsString()
  @IsOptional()
  kanbanColumnId?: string;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;
}
```

#### Service logic

**`create` — business rule:**
```typescript
if (!dto.clientId && !dto.systemId) {
  throw new BadRequestException('Task must be associated with a client or a system');
}
```

- `createdById` is always set from the JWT payload (`@CurrentUser()`), never from the request body.
- **`move`**: updates `kanbanColumnId`. Validates that the target column belongs to the same `KanbanArea` as the current column.
- **`remove`**: soft delete via `deletedAt`.

---

### 5.11 KanbanModule

**Responsibility:** Manage kanban board columns per area.

**Dependencies:** `PrismaModule`

#### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/kanban/columns` | Authenticated | List columns (optionally filter by area) |
| `POST` | `/kanban/columns` | SUPERADMIN | Create a column |
| `PATCH` | `/kanban/columns/:id` | SUPERADMIN | Update a column |
| `DELETE` | `/kanban/columns/:id` | SUPERADMIN | Delete a column |

#### DTOs

**`CreateKanbanColumnDto`**
```typescript
class CreateKanbanColumnDto {
  @IsString()
  name: string;

  @IsEnum(KanbanArea)
  area: KanbanArea;

  @IsInt()
  @Min(1)
  order: number;

  @IsHexColor()
  @IsOptional()
  color?: string;
}
```

**`QueryKanbanDto`**
```typescript
class QueryKanbanDto {
  @IsEnum(KanbanArea)
  @IsOptional()
  area?: KanbanArea;
}
```

#### Service logic

- `findAll`: returns columns ordered by `area`, then `order`.
- `create`: validates that no column exists with same `(area, order)` or `(area, name)` — Prisma unique constraint will catch this, but a clear `ConflictException` should be thrown.
- `delete`: blocks deletion if the column has active tasks (non-soft-deleted). Throws `ConflictException`.

---

## 6. Business Rules Reference

All rules are enforced in the service layer. None are enforced at the DB level.

| Rule | Module | Method | Exception |
|---|---|---|---|
| `CUSTOM` system requires `clientId` | SystemModule | `create`, `update` | `BadRequestException` |
| `SAAS` system must not have `clientId` | SystemModule | `create`, `update` | `BadRequestException` |
| Task must have `clientId` or `systemId` | TaskModule | `create` | `BadRequestException` |
| `PERCENTAGE` amount must be 0–100 | BudgetModule | `create` | `BadRequestException` |
| Budget acceptance auto-generates obligations | BudgetModule | `updateStatus` | — (automation) |
| Budget is immutable once ACCEPTED or REJECTED | BudgetModule | `updateStatus`, `remove` | `BadRequestException` |
| Payment to obligation auto-marks PAID when fully settled | FinancialModule | `create` | — (automation) |
| Kanban column deletion blocked when column has tasks | KanbanModule | `delete` | `ConflictException` |
| Task move must stay within same area | TaskModule | `move` | `BadRequestException` |
| `createdById` always from JWT, never from body | TaskModule | `create` | — (enforced in controller) |

---

## 7. Data Flows

### 7.1 Commercial Flow (Budget → Obligations)

```
POST /clients           → Create client
POST /budgets           → Create budget + payment plan items
PATCH /budgets/:id/status { status: "ACCEPTED" }
  → BudgetService.updateStatus()
  → ObligationService.createFromBudget()
    → PaymentPlanService.resolveAmount() (per item)
    → prisma.obligation.createMany()
```

### 7.2 Financial Flow (Payment → Obligation settlement)

```
POST /financial { obligationId, amount, ... }
  → FinancialService.create()
  → prisma.financialMovement.create()
  → ObligationService.checkAndMarkPaid(obligationId)
    → sum all movements for obligation
    → if sum >= obligation.amount → mark PAID
```

### 7.3 Operational Flow (Tasks)

```
POST /tasks { clientId or systemId, kanbanColumnId, ... }
  → TaskService.create()
  → validate clientId OR systemId present
  → inject createdById from JWT
  → prisma.task.create()

PATCH /tasks/:id/move { kanbanColumnId }
  → TaskService.move()
  → validate same KanbanArea
  → prisma.task.update({ kanbanColumnId })
```

---

## 8. Module Dependency Graph

```
AppModule
├── PrismaModule (global)
├── AuthModule → UserModule
├── UserModule
├── TagModule
├── ClientModule
├── SystemModule
├── BudgetModule → ObligationModule, PaymentPlanModule
├── PaymentPlanModule
├── ObligationModule
├── FinancialModule → ObligationModule
├── TaskModule
└── KanbanModule
```

---

## 9. Environment Variables

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/az_dashboard
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

---

## 10. Response Conventions

- All list endpoints return an array (no pagination in MVP unless specified).
- Soft-deleted records are always excluded from standard responses.
- All monetary amounts are returned as strings (Decimal serialization) to preserve precision.
- Dates are returned as ISO 8601 strings.
- HTTP status codes:
  - `200` — successful GET or PATCH
  - `201` — successful POST
  - `204` — successful DELETE
  - `400` — validation or business rule error
  - `401` — unauthenticated
  - `403` — insufficient role
  - `404` — record not found
  - `409` — conflict (duplicate, in-use resource)

---

## 11. Document Governance

This document must be updated when:
- A new module or endpoint is added
- A business rule changes
- A DTO changes its validation contract
- A new automation is introduced

This document must not be modified without also checking:
- `prisma/schema.prisma` — source of truth for data structure
- `01-product-decisions.md` — source of truth for business rules
- `03-database-schema.md` — source of truth for DB constraints
