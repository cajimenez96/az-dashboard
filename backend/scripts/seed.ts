import {
  PrismaClient,
  type Client,
  type System,
  type KanbanColumn,
  type Budget,
  type Obligation,
  ClientStatus,
  SystemType,
  SystemStatus,
  BudgetStatus,
  PaymentPlanType,
  ObligationStatus,
  MovementType,
  PaymentMethod,
  KanbanArea,
  TaskPriority,
  Currency,
} from '@prisma/client';
import { v4 as uuid } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding data...');

  // 👤 Obtener usuario admin (necesario para tasks)
  const admin = await prisma.user.findFirst({
    where: { role: 'SUPERADMIN' },
  });

  if (!admin) throw new Error('No admin user found. Run seed-users first.');

  // =========================
  // 1️⃣ CLIENTS
  // =========================
  const clientsData = [
    { name: 'TechCorp', status: ClientStatus.ACTIVE },
    { name: 'StartupX', status: ClientStatus.AT_RISK },
    { name: 'Agencia Nova', status: ClientStatus.ACTIVE },
    { name: 'Legacy Inc', status: ClientStatus.INACTIVE },
  ];

  const clients: Client[] = [];

  for (const client of clientsData) {
    const created = await prisma.client.create({
      data: {
        id: uuid(),
        name: client.name,
        email: `${client.name.toLowerCase().replace(/\s/g, '')}@mail.com`,
        status: client.status,
      },
    });

    clients.push(created);
  }

  // =========================
  // 2️⃣ SYSTEMS
  // =========================
  const systems: System[] = [];

  for (const client of clients) {
    const sys = await prisma.system.create({
      data: {
        id: uuid(),
        name: `${client.name} Platform`,
        type: Math.random() > 0.5 ? SystemType.SAAS : SystemType.CUSTOM,
        status: SystemStatus.ACTIVE,
        repoUrl: 'https://github.com/example/repo',
        clientId: client.id,
      },
    });

    systems.push(sys);
  }

  // =========================
  // 3️⃣ KANBAN COLUMNS
  // =========================
  const columnsData = [
    { name: 'TODO', area: KanbanArea.SOFTWARE, order: 1 },
    { name: 'DOING', area: KanbanArea.SOFTWARE, order: 2 },
    { name: 'DONE', area: KanbanArea.SOFTWARE, order: 3 },
  ];

  const columns: KanbanColumn[] = [];

  for (const col of columnsData) {
    const created = await prisma.kanbanColumn.create({
      data: {
        id: uuid(),
        name: col.name,
        area: col.area,
        order: col.order,
      },
    });

    columns.push(created);
  }

  // =========================
  // 4️⃣ TASKS
  // =========================
  for (const client of clients) {
    const system = systems.find((s) => s.clientId === client.id);

    for (let i = 0; i < 3; i++) {
      await prisma.task.create({
        data: {
          id: uuid(),
          title: `Task ${i + 1} - ${client.name}`,
          priority: TaskPriority.MEDIUM,
          kanbanColumnId: columns[0].id,
          clientId: client.id,
          systemId: system?.id,
          createdById: admin.id,
        },
      });
    }
  }

  // =========================
  // 5️⃣ BUDGETS
  // =========================
  const budgets: Budget[] = [];

  for (const client of clients) {
    const budget = await prisma.budget.create({
      data: {
        id: uuid(),
        title: `Proyecto ${client.name}`,
        totalAmount: 3000,
        currency: Currency.USD,
        status:
          client.status === ClientStatus.AT_RISK
            ? BudgetStatus.SENT
            : BudgetStatus.ACCEPTED,
        clientId: client.id,
      },
    });

    budgets.push(budget);
  }

  // =========================
  // 6️⃣ PAYMENT PLAN + OBLIGATIONS
  // =========================
  const obligations: Obligation[] = [];

  for (const budget of budgets) {
    if (budget.status !== BudgetStatus.ACCEPTED) continue;

    for (let i = 0; i < 3; i++) {
      const amount = 1000;

      const planItem = await prisma.paymentPlanItem.create({
        data: {
          id: uuid(),
          order: i + 1,
          budgetId: budget.id,
          amount,
          type: PaymentPlanType.FIXED,
          dueDate: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000),
        },
      });

      const obligation = await prisma.obligation.create({
        data: {
          id: uuid(),
          amount,
          currency: Currency.USD,
          dueDate: planItem.dueDate,
          clientId: budget.clientId,
          budgetId: budget.id,
          paymentPlanItemId: planItem.id,
          status: ObligationStatus.PENDING,
        },
      });

      obligations.push(obligation);
    }
  }

  // =========================
  // 7️⃣ PAYMENTS (FINANCIAL MOVEMENTS)
  // =========================
  for (const obligation of obligations) {
    const payPartial = Math.random() > 0.5;

    if (!payPartial) continue;

    const paymentAmount = obligation.amount.toNumber() / 2;

    await prisma.financialMovement.create({
      data: {
        id: uuid(),
        type: MovementType.INCOME,
        amount: paymentAmount,
        currency: Currency.USD,
        paymentMethod: PaymentMethod.TRANSFER,
        date: new Date(),
        clientId: obligation.clientId,
        obligationId: obligation.id,
        description: 'Pago parcial',
      },
    });
  }

  console.log('✅ Seed completa');
}

main().finally(() => prisma.$disconnect());
