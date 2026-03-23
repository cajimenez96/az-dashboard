# AZ Dashboard — CRM & Product Manager

Internal management platform for **AZ Marketing**. Centralizes client management, budgets, financial tracking, task management with Kanban boards, and a full audit trail.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui |
| Backend | NestJS 11 · TypeScript · Prisma 5 · PostgreSQL |
| Auth | JWT (stateless) · bcrypt |
| State | Zustand (auth) · TanStack Query (server state) |
| Forms | React Hook Form · Zod |
| Drag & Drop | dnd-kit |
| Charts | Recharts |

---

## Project Structure

```
az-dashboard/
├── backend/                  # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma     # Source of truth for all data models
│   │   └── migrations/       # Prisma migration history
│   ├── scripts/
│   │   └── seed.ts           # Database seed (idempotent)
│   └── src/
│       ├── auth/             # JWT authentication
│       ├── users/            # User management (SUPERADMIN)
│       ├── clients/          # Client CRUD + soft delete
│       ├── systems/          # SAAS / CUSTOM systems
│       ├── budgets/          # Budgets + payment plans
│       ├── financial/        # Obligations + movements
│       ├── tasks/            # Task management
│       ├── kanban/           # Kanban column config
│       ├── activity-log/     # Audit trail
│       ├── common/           # Guards, decorators, types
│       └── prisma/           # PrismaService (global)
│
├── az-dashboard-frontend/    # Next.js App Router
│   ├── app/
│   │   ├── (dashboard)/      # Protected routes (clients, tasks, budgets, finance)
│   │   └── login/            # Public auth page
│   ├── src/
│   │   ├── features/         # Feature modules (components, hooks, api)
│   │   ├── components/       # Shared layout & UI components
│   │   └── lib/              # i18n, utilities
│   ├── components/ui/        # shadcn/ui primitives
│   ├── stores/               # Zustand stores
│   ├── services/             # Auth service
│   └── lib/
│       └── api.ts            # Axios instance + JWT interceptors
│
└── docs/                     # Technical documentation
    ├── 01-product-decisions.md
    ├── 03-database-schema.md
    ├── 04-backend-modules.md
    ├── 05-api-endpoints.md
    └── 06-backend-implementation.md
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- pnpm or npm

### Backend

```bash
cd backend
npm install

# Configure environment
cp .env.example .env
# Fill in: DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN

# Run migrations
npx prisma migrate dev

# Seed initial data
npx ts-node scripts/seed.ts

# Start development server
npm run start:dev
```

The API runs on `http://localhost:3001`.

### Frontend

```bash
cd az-dashboard-frontend
npm install

# Configure environment
cp .env.example .env.local
# Fill in: NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Start development server
npm run dev
```

The frontend runs on `http://localhost:3000`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | Token expiry (e.g. `7d`) |

### Frontend (`az-dashboard-frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL (e.g. `http://localhost:3001/api/v1`) |

---

## API

Base URL: `/api/v1`

All endpoints require `Authorization: Bearer <token>` unless marked **Public**.

### Modules

| Module | Endpoints | Access |
|---|---|---|
| Auth | `POST /auth/login` | Public |
| Users | `GET/POST/PATCH /users` | SUPERADMIN |
| Clients | `GET/POST/PATCH/DELETE /clients` | Authenticated |
| Systems | `GET/POST/PATCH/DELETE /systems` | Authenticated |
| Budgets | `GET/POST/PATCH/DELETE /budgets` | Authenticated |
| Obligations | `GET/POST/PATCH/DELETE /financial/obligations` | Authenticated |
| Movements | `GET/POST/PATCH/DELETE /financial/movements` | Authenticated |
| Tasks | `GET/POST/PATCH/DELETE /tasks` | Authenticated |
| Kanban | `GET /kanban-columns` · `POST/PATCH/DELETE` | SUPERADMIN (mutations) |
| Activity Logs | `GET /activity-logs` | SUPERADMIN |

Full contract: [`docs/05-api-endpoints.md`](docs/05-api-endpoints.md)

---

## Data Model (key entities)

```
User
 └── Tasks (created / assigned)
 └── ActivityLogs

Client
 ├── Systems (CUSTOM type)
 ├── Budgets → PaymentPlanItems → Obligations
 ├── FinancialMovements
 └── Tasks

KanbanColumn (MARKETING | SOFTWARE)
 └── Tasks
```

### Enums

| Enum | Values |
|---|---|
| `Role` | `SUPERADMIN`, `USER` |
| `Profile` | `MARKETER`, `DEVELOPER` |
| `BudgetStatus` | `DRAFT → SENT → ACCEPTED / REJECTED` |
| `ObligationStatus` | `PENDING`, `PAID` |
| `TaskPriority` | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `KanbanArea` | `MARKETING`, `SOFTWARE` |
| `Currency` | `ARS`, `USD` |
| `MovementType` | `INCOME`, `EXPENSE` |

---

## Key Business Rules

- **Budget lifecycle:** `DRAFT → SENT → ACCEPTED` (auto-generates Obligations) / `REJECTED` (terminal)
- **Auto-settlement:** When sum of linked movements ≥ obligation amount → obligation marked `PAID` automatically
- **Task context:** Every task must have a `clientId` or `systemId` (or both)
- **System type:** `CUSTOM` requires `clientId`; `SAAS` must not have one
- **Soft delete:** Client, System, Budget, Task use `deletedAt`. Obligation and FinancialMovement are hard-deleted with guards
- **Audit trail:** All mutations (create/update/delete) on Clients, Budgets, Tasks, and Financial movements are recorded in `ActivityLog`
- **Monetary precision:** All amounts use `Decimal(12,2)` — never float

---

## Seed Data

Running `npx ts-node scripts/seed.ts` (idempotent — safe to re-run) creates:

| Entity | Value |
|---|---|
| Admin user | `admin@azmarketing.com` / `changeme123` · role: `SUPERADMIN` |
| Client | `Cliente Demo` |
| Tag | `Urgente` |
| System | `Sistema Demo` (SAAS) |
| Budget | `Presupuesto Demo` (DRAFT, $5000 USD) |
| Kanban column | `Backlog` (MARKETING area) |
| Task | `Tarea Demo` |

---

## Roles

| Role | Capabilities |
|---|---|
| `SUPERADMIN` | Full access: users, tags, kanban config, activity logs |
| `USER` | Operational access: clients, tasks, budgets, finance |

> Profile (`MARKETER` / `DEVELOPER`) only affects the UI — it does not restrict data access.

---

## Docs

| Document | Description |
|---|---|
| [`01-product-decisions.md`](docs/01-product-decisions.md) | Why decisions were made |
| [`03-database-schema.md`](docs/03-database-schema.md) | Full schema reference |
| [`04-backend-modules.md`](docs/04-backend-modules.md) | Business logic per module |
| [`05-api-endpoints.md`](docs/05-api-endpoints.md) | Full HTTP contract |
| [`06-backend-implementation.md`](docs/06-backend-implementation.md) | Implementation plan |
