# 📄 06 — Backend Implementation Plan

## 1. Objective

This document defines the step-by-step implementation plan for the AZ CRM & Product Manager backend using NestJS.

It translates the following specifications into executable development phases:

- `01-product-decisions.md` — why decisions were made
- `03-database-schema.md` — data structure
- `04-backend-modules.md` — module architecture and business logic
- `05-api-endpoints.md` — HTTP contracts

> This is not architecture. This is execution. Each phase produces working, testable code before the next phase begins.

---

## 2. Tech Stack

| Concern | Tool |
|---|---|
| Framework | NestJS (TypeScript) |
| ORM | Prisma Client |
| Database | PostgreSQL |
| Auth | JWT (stateless, `@nestjs/jwt`) |
| Validation | `class-validator` + `class-transformer` |
| Password hashing | `bcrypt` |
| Config | `@nestjs/config` + `.env` |

---

## 3. Universal Rules

These rules apply to every module. No exceptions.

### 3.1 Layered Architecture

```
Request → Controller → Service → Prisma → Database
```

- **Controllers** handle HTTP only: parse request, call service, return response. Zero business logic.
- **Services** own all business logic, validations, and automations.
- **Prisma** is called directly from services. No repository layer.

### 3.2 Input Validation

- Every endpoint that accepts a body uses a DTO decorated with `class-validator`.
- The global `ValidationPipe` is applied in `main.ts` with `whitelist: true` and `forbidNonWhitelisted: true`.
- Business rule violations throw named NestJS exceptions (`BadRequestException`, `NotFoundException`, `ConflictException`).

### 3.3 Authentication

- `JwtAuthGuard` is applied globally via `APP_GUARD`.
- Routes that must be public are decorated with `@Public()`.
- The authenticated user is injected via `@CurrentUser()` — **never** trusted from the request body.
- `createdById` on tasks is always sourced from the JWT, never from the client.

### 3.4 Soft Delete

- All queries on `Client`, `System`, `Budget`, and `Task` must include `WHERE deletedAt IS NULL`.
- Deletion sets `deletedAt = new Date()`. No hard deletes on these models.

### 3.5 Transactions

Two operations require Prisma transactions:
1. **Budget acceptance** — status update + obligation generation must be atomic.
2. **Financial movement creation** — movement insert + obligation status check must be atomic.

### 3.6 Monetary Values

- Never use `number` or `float` for monetary amounts in services.
- Use Prisma's `Decimal` type throughout. Serialize as strings in API responses.

### 3.7 Response Shape

All responses follow the standard envelope from `05-api-endpoints.md`:

```typescript
// Success
{ success: true, data: T }

// Error (via NestJS exception filter)
{ success: false, error: 'ERROR_CODE', message: 'description' }
```

Apply a global response interceptor to wrap all successful responses automatically.

---

## 4. Implementation Phases

Phases must be completed in order. Each phase is independently testable before moving to the next.

---

### Phase 1 — Project Initialization

**Goal:** Working NestJS application connected to PostgreSQL.

#### 1.1 Create project

```bash
nest new az-dashboard-api
cd az-dashboard-api
```

#### 1.2 Install dependencies

```bash
# ORM
npm install prisma @prisma/client
npx prisma init

# Auth
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install -D @types/passport-jwt

# Validation
npm install class-validator class-transformer

# Config
npm install @nestjs/config

# Password hashing
npm install bcrypt
npm install -D @types/bcrypt
```

#### 1.3 Configure environment

```env
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/az_dashboard
JWT_SECRET=your-strong-secret-key
JWT_EXPIRES_IN=7d
```

#### 1.4 Configure `main.ts`

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  await app.listen(3000);
}
```

**Deliverable:** `GET /` returns `200`. App connects to DB without errors.

---

### Phase 2 — Prisma Setup

**Goal:** Database schema migrated, Prisma client generated, PrismaService available globally.

#### 2.1 Copy schema

Copy the contents of `prisma/schema.prisma` (from `03-database-schema.md`) into the project's `prisma/schema.prisma`.

#### 2.2 Run migration

```bash
npx prisma migrate dev --name init
npx prisma generate
```

#### 2.3 Create PrismaModule and PrismaService

```typescript
// prisma/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}

// prisma/prisma.module.ts
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

Import `PrismaModule` in `AppModule`. Because it is `@Global()`, it does not need to be imported per feature module.

#### 2.4 Run seed

Create `prisma/seed.ts` with the following required seed data:

```typescript
// Seed: Tags
await prisma.tag.createMany({
  data: [
    { name: 'Enterprise', color: '#6366f1' },
    { name: 'SMB',        color: '#10b981' },
    { name: 'Inactive',   color: '#6b7280' },
  ],
  skipDuplicates: true,
});

// Seed: Kanban columns
await prisma.kanbanColumn.createMany({
  data: [
    { area: 'MARKETING', name: 'Backlog',     order: 1, color: '#6b7280' },
    { area: 'MARKETING', name: 'In Progress', order: 2, color: '#3b82f6' },
    { area: 'MARKETING', name: 'Review',      order: 3, color: '#f59e0b' },
    { area: 'MARKETING', name: 'Done',        order: 4, color: '#10b981' },
    { area: 'SOFTWARE',  name: 'Backlog',     order: 1, color: '#6b7280' },
    { area: 'SOFTWARE',  name: 'In Progress', order: 2, color: '#3b82f6' },
    { area: 'SOFTWARE',  name: 'Review',      order: 3, color: '#f59e0b' },
    { area: 'SOFTWARE',  name: 'Done',        order: 4, color: '#10b981' },
  ],
  skipDuplicates: true,
});

// Seed: SUPERADMIN user
await prisma.user.upsert({
  where: { email: 'admin@azmarketing.com' },
  update: {},
  create: {
    email:    'admin@azmarketing.com',
    name:     'Admin',
    password: await bcrypt.hash('changeme123', 10),
    role:     'SUPERADMIN',
    profile:  'DEVELOPER',
  },
});
```

```bash
npx prisma db seed
```

**Deliverable:** Database migrated. Tags, kanban columns, and SUPERADMIN user exist.

---

### Phase 3 — Shared Infrastructure

**Goal:** JWT guard, roles guard, decorators, and response interceptor in place before any feature module is built.

#### 3.1 JwtStrategy

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    return payload; // attached to request as req.user
  }
}
```

#### 3.2 JwtAuthGuard (global)

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

Register globally in `AppModule`:
```typescript
providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }]
```

#### 3.3 @Public() decorator

```typescript
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

#### 3.4 RolesGuard + @Roles() decorator

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

Register globally alongside `JwtAuthGuard`.

#### 3.5 @CurrentUser() decorator

```typescript
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

#### 3.6 Response Interceptor

Wraps all successful responses in `{ success: true, data: ... }`:

```typescript
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({ success: true, data })),
    );
  }
}
```

Register globally via `APP_INTERCEPTOR`.

#### 3.7 Exception Filter

Wraps all exceptions in `{ success: false, error: 'CODE', message: '...' }`.

**Deliverable:** POST a request without a token → returns `401` with envelope. POST with invalid token → `401`. All infrastructure tested.

---

### Phase 4 — AuthModule

**Goal:** `POST /api/v1/auth/login` returns a valid JWT.

**Reference:** `04-backend-modules.md § 5.1`, `05-api-endpoints.md § 3`

#### Implementation steps

1. Create `AuthModule` importing `JwtModule.registerAsync(...)` configured from `ConfigService`.
2. `AuthService.login(dto)`:
   - Find user by email via `PrismaService`. Throw `UnauthorizedException` if not found.
   - `bcrypt.compare(dto.password, user.password)`. Throw `UnauthorizedException` if mismatch.
   - `jwtService.sign({ sub: user.id, email: user.email, role: user.role, profile: user.profile })`.
   - Return `{ access_token, user }`.
3. `AuthController` — decorate route with `@Public()`.

**Deliverable:** `POST /api/v1/auth/login` with valid credentials returns `{ access_token, user }`. Invalid credentials return `401`.

---

### Phase 5 — UsersModule

**Goal:** SUPERADMIN can create and manage users.

**Reference:** `04-backend-modules.md § 5.2`, `05-api-endpoints.md § 4`

#### Implementation steps

1. `CreateUserDto` — validates email, name (min 2), password (min 8), optional role and profile enums.
2. `UsersService.create(dto)`:
   - Check email uniqueness — throw `ConflictException('EMAIL_ALREADY_EXISTS')` if taken.
   - `bcrypt.hash(dto.password, 10)`.
   - `prisma.user.create(...)`. Never return `password` field.
3. `UsersService.findAll()` — `prisma.user.findMany({ select: { ... } })` excluding `password`.
4. `UsersService.findMe(userId)` — find by `sub` from JWT.
5. `UsersService.update(id, dto)` — `PartialType` of create DTO excluding password.
6. All routes except `GET /users/me` decorated with `@Roles(Role.SUPERADMIN)`.

**Deliverable:** SUPERADMIN can create a USER. `GET /users/me` returns authenticated user's profile.

---

### Phase 6 — TagsModule

**Goal:** SUPERADMIN can manage tags. All users can list them.

**Reference:** `04-backend-modules.md § 5.4`, `05-api-endpoints.md § 6`

#### Implementation steps

1. `CreateTagDto` — name (min 2, unique), optional color (hex).
2. `TagsService.create(dto)` — throw `ConflictException('TAG_ALREADY_EXISTS')` if name taken.
3. `TagsService.findAll()` — return all tags.
4. `TagsService.delete(id)`:
   - Check `prisma.clientTag.count({ where: { tagId: id } })`.
   - Throw `ConflictException('TAG_IN_USE')` if count > 0.
   - Otherwise `prisma.tag.delete(...)`.
5. Create/update/delete routes: `@Roles(Role.SUPERADMIN)`. List route: authenticated only.

**Deliverable:** Tags can be listed by any user. Only SUPERADMIN can create/update/delete. Delete blocked if tag is in use.

---

### Phase 7 — ClientsModule

**Goal:** Full client CRUD with tag assignment and soft delete.

**Reference:** `04-backend-modules.md § 5.3`, `05-api-endpoints.md § 5`

#### Implementation steps

1. `CreateClientDto` — name (min 2), optional email/phone/company/notes/status, optional `tagIds: string[]`.
2. `QueryClientDto` — optional status, tagId, search.
3. `ClientsService.findAll(query)`:
   - Always: `where: { deletedAt: null }`.
   - If `status`: add to where.
   - If `tagId`: `where: { tags: { some: { tagId } } }`.
   - If `search`: `where: { OR: [{ name: { contains: search } }, { email: { contains: search } }, { company: { contains: search } }] }`.
   - Include `tags: { include: { tag: true } }`.
4. `ClientsService.findOne(id)`:
   - `prisma.client.findFirst({ where: { id, deletedAt: null } })`.
   - Throw `NotFoundException('CLIENT_NOT_FOUND')` if not found.
   - Include tags, active systems, open obligations count.
5. `ClientsService.create(dto)`:
   - Create client.
   - If `tagIds`: validate each tag exists, create `ClientTag` records.
6. `ClientsService.update(id, dto)`:
   - If `tagIds` provided: delete all existing `ClientTag` for client, re-create.
7. `ClientsService.remove(id)`:
   - `prisma.client.update({ where: { id }, data: { deletedAt: new Date() } })`.
   - Does NOT cascade to related records.

**Deliverable:** Full client CRUD. Filtering by status, tag, and search. Soft delete confirmed (client hidden from list but data preserved).

---

### Phase 8 — SystemsModule

**Goal:** Manage SAAS and CUSTOM systems with type-based validation.

**Reference:** `04-backend-modules.md § 5.5`, `05-api-endpoints.md § 7`

#### Implementation steps

1. `CreateSystemDto` — name, type (enum), optional description/status/repoUrl/clientId.
2. `SystemsService.create(dto)`:
   ```typescript
   if (dto.type === 'CUSTOM' && !dto.clientId) {
     throw new BadRequestException('CLIENT_REQUIRED_FOR_CUSTOM');
   }
   if (dto.type === 'SAAS' && dto.clientId) {
     throw new BadRequestException('CLIENT_NOT_ALLOWED_FOR_SAAS');
   }
   ```
   If `clientId` provided, verify client exists and is not soft-deleted.
3. `SystemsService.findAll(query)` — filter by type, clientId, status. Exclude `deletedAt IS NOT NULL`.
4. `SystemsService.remove(id)` — soft delete via `deletedAt`.

**Deliverable:** CUSTOM system without clientId returns `400`. SAAS system with clientId returns `400`. Soft delete works.

---

### Phase 9 — BudgetModule + PaymentPlanModule

**Goal:** Create budgets with payment plans. Accept/reject budgets with automatic obligation generation.

**Reference:** `04-backend-modules.md § 5.6–5.7`, `05-api-endpoints.md § 8`

#### 9.1 PaymentPlanService (internal, no controller)

```typescript
validateItems(items: PaymentPlanItemDto[], totalAmount: Decimal): void {
  const percentageItems = items.filter(i => i.type === 'PERCENTAGE');
  const fixedItems = items.filter(i => i.type === 'FIXED');

  for (const item of percentageItems) {
    const amount = new Decimal(item.amount);
    if (amount.lt(0) || amount.gt(100)) {
      throw new BadRequestException('PERCENTAGE_OUT_OF_RANGE');
    }
  }
  if (percentageItems.length > 0 && fixedItems.length === 0) {
    const sum = percentageItems.reduce((s, i) => s.add(i.amount), new Decimal(0));
    if (!sum.eq(100)) throw new BadRequestException('PERCENTAGE_MUST_SUM_100');
  }
  if (fixedItems.length > 0) {
    const sum = fixedItems.reduce((s, i) => s.add(i.amount), new Decimal(0));
    if (sum.gt(totalAmount)) throw new BadRequestException('FIXED_EXCEEDS_TOTAL');
  }
}

resolveAmount(item: PaymentPlanItemDto, totalAmount: Decimal): Decimal {
  if (item.type === 'PERCENTAGE') {
    return totalAmount.mul(new Decimal(item.amount)).div(100);
  }
  return new Decimal(item.amount);
}
```

#### 9.2 BudgetsService.create(dto)

```typescript
this.paymentPlanService.validateItems(dto.paymentPlanItems, new Decimal(dto.totalAmount));

return this.prisma.budget.create({
  data: {
    ...budgetFields,
    paymentPlanItems: {
      create: dto.paymentPlanItems.map(item => ({ ...item })),
    },
  },
  include: { paymentPlanItems: true },
});
```

#### 9.3 BudgetsService.updateStatus(id, dto) — CRITICAL: use transaction

```typescript
async updateStatus(id: string, dto: UpdateBudgetStatusDto) {
  return this.prisma.$transaction(async (tx) => {
    const budget = await tx.budget.findFirstOrThrow({
      where: { id, deletedAt: null },
      include: { paymentPlanItems: true },
    });

    if (budget.status === 'ACCEPTED' || budget.status === 'REJECTED') {
      throw new BadRequestException('BUDGET_ALREADY_CLOSED');
    }

    const updated = await tx.budget.update({
      where: { id },
      data: { status: dto.status },
    });

    if (dto.status === 'ACCEPTED') {
      const obligations = budget.paymentPlanItems.map((item) => ({
        clientId:          budget.clientId,
        budgetId:          budget.id,
        paymentPlanItemId: item.id,
        currency:          budget.currency,
        amount:            this.paymentPlanService.resolveAmount(item, budget.totalAmount),
        dueDate:           item.dueDate,
        status:            'PENDING',
      }));
      await tx.obligation.createMany({ data: obligations });
    }

    return updated;
  });
}
```

#### 9.4 BudgetsService.remove(id)

```typescript
if (budget.status !== 'DRAFT') {
  throw new BadRequestException('BUDGET_NOT_DELETABLE');
}
await this.prisma.budget.update({ where: { id }, data: { deletedAt: new Date() } });
```

**Deliverable:** Budget created with items. Accepting a budget creates exactly one obligation per item. Obligations have resolved amounts (PERCENTAGE converted to real value). Rejecting a budget blocks future status changes.

---

### Phase 10 — ObligationsModule

**Goal:** Track and manage client debt. Support manual obligations.

**Reference:** `04-backend-modules.md § 5.8`, `05-api-endpoints.md § 9`

#### Implementation steps

1. `ObligationsService.findAll(query)` — filter by clientId, status, dueBefore. Include `movements` for `totalPaid` calculation.
2. `ObligationsService.findOne(id)` — include full movements list, calculate `totalPaid` and `remaining`.
3. `ObligationsService.create(dto)` — manual obligation creation (no paymentPlanItemId).
4. `ObligationsService.markPaid(id)`:
   - Verify `status !== 'PAID'` — throw `BadRequestException('OBLIGATION_ALREADY_PAID')` if already paid.
   - `prisma.obligation.update({ data: { status: 'PAID' } })`.
5. `ObligationsService.checkAndMarkPaid(obligationId, tx?)` — internal method called by FinancialModule:

```typescript
async checkAndMarkPaid(obligationId: string, tx = this.prisma) {
  const obligation = await tx.obligation.findUnique({
    where: { id: obligationId },
    include: { movements: true },
  });

  const totalPaid = obligation.movements.reduce(
    (sum, m) => sum.add(m.amount),
    new Decimal(0),
  );

  if (totalPaid.gte(obligation.amount)) {
    await tx.obligation.update({
      where: { id: obligationId },
      data: { status: 'PAID' },
    });
  }
}
```

**Deliverable:** Obligations list with totalPaid per item. Manual obligation creation. Mark as paid (manual and auto).

---

### Phase 11 — FinancialModule

**Goal:** Record income and expenses. Auto-settle obligations on full payment.

**Reference:** `04-backend-modules.md § 5.9`, `05-api-endpoints.md § 10`

#### Implementation steps

1. `CreateFinancialMovementDto` — type, amount, currency, paymentMethod, date, optional description/clientId/obligationId.
2. `QueryFinancialDto` — optional type, clientId, from, to.
3. `FinancialService.create(dto)` — CRITICAL: use transaction:

```typescript
async create(dto: CreateFinancialMovementDto) {
  return this.prisma.$transaction(async (tx) => {
    if (dto.clientId) {
      const client = await tx.client.findFirst({ where: { id: dto.clientId, deletedAt: null } });
      if (!client) throw new NotFoundException('CLIENT_NOT_FOUND');
    }

    if (dto.obligationId) {
      const obligation = await tx.obligation.findUnique({ where: { id: dto.obligationId } });
      if (!obligation) throw new NotFoundException('OBLIGATION_NOT_FOUND');
    }

    const movement = await tx.financialMovement.create({ data: { ...dto } });

    if (dto.obligationId) {
      await this.obligationService.checkAndMarkPaid(dto.obligationId, tx);
    }

    return movement;
  });
}
```

4. `FinancialService.findAll(query)` — filter by type, clientId, date range.
5. `FinancialService.getSummary(query)`:

```typescript
const [income, expense] = await Promise.all([
  this.prisma.financialMovement.aggregate({
    where: { ...filters, type: 'INCOME' },
    _sum: { amount: true },
  }),
  this.prisma.financialMovement.aggregate({
    where: { ...filters, type: 'EXPENSE' },
    _sum: { amount: true },
  }),
]);
const totalIncome  = income._sum.amount  ?? new Decimal(0);
const totalExpense = expense._sum.amount ?? new Decimal(0);
return { totalIncome, totalExpense, balance: totalIncome.sub(totalExpense) };
```

**Deliverable:** Income registered against an obligation auto-marks it PAID when total reaches amount. Expenses register without obligation. Summary returns correct totals.

---

### Phase 12 — KanbanModule

**Goal:** Manage kanban columns per area. Only SUPERADMIN can modify.

**Reference:** `04-backend-modules.md § 5.11`, `05-api-endpoints.md § 12`

#### Implementation steps

1. `CreateKanbanColumnDto` — name, area (enum), order (int min 1), optional color (hex).
2. `KanbanService.findAll(query)` — filter by optional area. Order by `area` ASC, `order` ASC.
3. `KanbanService.create(dto)`:
   - Attempt create. Prisma unique constraint on `(area, order)` and `(area, name)` will throw — catch and re-throw as `ConflictException('COLUMN_NAME_EXISTS')` or `ConflictException('COLUMN_ORDER_EXISTS')`.
4. `KanbanService.delete(id)`:
   ```typescript
   const taskCount = await this.prisma.task.count({
     where: { kanbanColumnId: id, deletedAt: null },
   });
   if (taskCount > 0) throw new ConflictException('COLUMN_HAS_ACTIVE_TASKS');
   await this.prisma.kanbanColumn.delete({ where: { id } });
   ```
5. Create/update/delete routes: `@Roles(Role.SUPERADMIN)`.

**Deliverable:** Columns managed by SUPERADMIN. Delete blocked with active tasks. Seed columns are present and queryable.

---

### Phase 13 — TasksModule

**Goal:** Create and manage tasks with kanban integration and context validation.

**Reference:** `04-backend-modules.md § 5.10`, `05-api-endpoints.md § 11`

#### Implementation steps

1. `CreateTaskDto` — title, optional description/priority/dueDate/clientId/systemId/assignedToId, required kanbanColumnId.
2. `QueryTaskDto` — optional clientId, systemId, assignedToId, kanbanColumnId, area, priority.
3. `TasksService.create(dto, currentUser)`:
   ```typescript
   if (!dto.clientId && !dto.systemId) {
     throw new BadRequestException('TASK_REQUIRES_CONTEXT');
   }
   // Validate references exist
   // Set createdById = currentUser.sub
   ```
4. `TasksService.findAll(query)`:
   - Always: `where: { deletedAt: null }`.
   - If `area`: `where: { kanbanColumn: { area } }`.
5. `TasksService.move(id, dto)`:
   ```typescript
   const task = await this.prisma.task.findFirst({
     where: { id, deletedAt: null },
     include: { kanbanColumn: true },
   });
   const targetColumn = await this.prisma.kanbanColumn.findUnique({
     where: { id: dto.kanbanColumnId },
   });
   if (!targetColumn) throw new NotFoundException('KANBAN_COLUMN_NOT_FOUND');
   if (task.kanbanColumn.area !== targetColumn.area) {
     throw new BadRequestException('CROSS_AREA_MOVE_NOT_ALLOWED');
   }
   return this.prisma.task.update({
     where: { id },
     data: { kanbanColumnId: dto.kanbanColumnId },
   });
   ```
6. `TasksService.remove(id)` — soft delete via `deletedAt`.

**Deliverable:** Task without context returns `400`. Task moves within same area. Cross-area move returns `400`. `createdById` always matches authenticated user.

---

### Phase 14 — Client 360° Overview

**Goal:** Single endpoint returning the complete client dashboard snapshot.

**Reference:** `04-backend-modules.md § 5.3.1`, `05-api-endpoints.md § 5`

#### Endpoint

```
GET /clients/:id
```

This endpoint is the full client detail view. It aggregates all data for the dashboard.

#### Implementation in ClientsService.findOne(id)

```typescript
const [client, financialData, tasks] = await Promise.all([
  this.prisma.client.findFirst({
    where: { id, deletedAt: null },
    include: {
      tags: { include: { tag: true } },
      systems: { where: { deletedAt: null } },
    },
  }),
  this.prisma.$transaction([
    // totalBilled: accepted budgets
    this.prisma.budget.aggregate({
      where: { clientId: id, status: 'ACCEPTED', deletedAt: null },
      _sum: { totalAmount: true },
    }),
    // totalCollected: income movements
    this.prisma.financialMovement.aggregate({
      where: { clientId: id, type: 'INCOME' },
      _sum: { amount: true },
    }),
    // pendingDebt: pending obligations
    this.prisma.obligation.aggregate({
      where: { clientId: id, status: 'PENDING' },
      _sum: { amount: true },
    }),
    // upcoming due dates
    this.prisma.obligation.findMany({
      where: { clientId: id, status: 'PENDING' },
      orderBy: { dueDate: 'asc' },
      take: 5,
    }),
  ]),
  this.prisma.task.findMany({
    where: { clientId: id, deletedAt: null },
    include: { kanbanColumn: true, assignedTo: true },
  }),
]);

if (!client) throw new NotFoundException('CLIENT_NOT_FOUND');

return {
  ...client,
  financial: {
    totalBilled:      financialData[0]._sum.totalAmount ?? '0.00',
    totalCollected:   financialData[1]._sum.amount      ?? '0.00',
    pendingDebt:      financialData[2]._sum.amount      ?? '0.00',
    upcomingDueDates: financialData[3],
  },
  tasks,
};
```

**Deliverable:** Single request returns all client data needed for the dashboard. Financial aggregates are correct.

---

## 5. Definition of Done

A module is complete when:

- [ ] All endpoints from `05-api-endpoints.md` are implemented
- [ ] All business rules from `04-backend-modules.md` are enforced
- [ ] All error codes from `05-api-endpoints.md` are thrown with correct HTTP status
- [ ] Soft delete filter applied everywhere applicable
- [ ] Transactions used where required
- [ ] `createdById` never accepted from body (tasks)
- [ ] Tested manually via Postman or equivalent

---

## 6. Claude Execution Prompt

Use this prompt to generate each module in Cursor or Claude:

```
Based on the following documents for AZ CRM & Product Manager:
- prisma/schema.prisma (data structure)
- docs/04-backend-modules.md (business logic)
- docs/05-api-endpoints.md (HTTP contracts)
- docs/06-backend-implementation.md (implementation plan)

Generate the complete NestJS module for: [MODULE NAME]

Requirements:
- Controller, Service, DTOs, Module file
- Use PrismaService (injected, global module)
- Use class-validator on all DTOs (whitelist: true)
- Enforce all business rules in the service layer
- Use Prisma transactions where documented
- Never accept createdById from body
- Filter deletedAt = null on all queries where applicable
- Throw named error codes matching 05-api-endpoints.md
- Return plain data objects (response envelope applied by global interceptor)

Do NOT add features beyond what is documented.
Do NOT explain. Generate production-ready code only.
```

---

## 7. Document Governance

This document must be updated when:
- A new phase is added or an existing phase changes
- A business rule changes that affects implementation order
- A new technical dependency is introduced
- The definition of done criteria changes

This document must not be modified without also verifying:
- `04-backend-modules.md` — module architecture must match
- `05-api-endpoints.md` — endpoint contracts must match
- `prisma/schema.prisma` — data structure must match
