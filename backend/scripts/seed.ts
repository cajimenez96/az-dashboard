// scripts/seed-all.ts
import { PrismaClient, ClientStatus, TaskPriority, KanbanArea, Role, Profile, SystemType, SystemStatus, BudgetStatus, PaymentPlanType, ObligationStatus, MovementType, PaymentMethod, Currency } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1️⃣ Users
  const hashedPassword = await bcrypt.hash('changeme123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@azmarketing.com' },
    update: {},
    create: {
      email: 'admin@azmarketing.com',
      name: 'Admin',
      password: hashedPassword,
      role: Role.SUPERADMIN,
      profile: Profile.DEVELOPER,
    },
  });

  // 2️⃣ Clients
  const client = await prisma.client.upsert({
    where: { id: 'seed-client-demo' },
    update: {},
    create: {
      id: 'seed-client-demo',
      name: 'Cliente Demo',
      email: 'cliente@demo.com',
      phone: '+54 9 123456789',
      company: 'Demo S.A.',
      notes: 'Cliente para pruebas',
      status: ClientStatus.ACTIVE,
    },
  });

  // 3️⃣ Tags
  const tag = await prisma.tag.upsert({
    where: { name: 'Urgente' },
    update: {},
    create: {
      name: 'Urgente',
      color: '#FF0000',
    },
  });

  // 4️⃣ ClientTag
  await prisma.clientTag.upsert({
    where: { clientId_tagId: { clientId: client.id, tagId: tag.id } },
    update: {},
    create: {
      clientId: client.id,
      tagId: tag.id,
    },
  });

  // 5️⃣ Systems
  const system = await prisma.system.upsert({
    where: { id: 'seed-system-demo' },
    update: {},
    create: {
      id: 'seed-system-demo',
      name: 'Sistema Demo',
      description: 'Sistema de prueba',
      type: SystemType.SAAS,
      status: SystemStatus.ACTIVE,
      clientId: client.id,
      repoUrl: 'https://github.com/demo/repo',
    },
  });

  // 6️⃣ Budgets
  const budget = await prisma.budget.upsert({
    where: { id: 'seed-budget-demo' },
    update: {},
    create: {
      id: 'seed-budget-demo',
      title: 'Presupuesto Demo',
      description: 'Presupuesto de prueba',
      currency: Currency.USD,
      totalAmount: 5000,
      status: BudgetStatus.DRAFT,
      clientId: client.id,
    },
  });

  // 7️⃣ PaymentPlanItems
  await prisma.paymentPlanItem.upsert({
    where: { id: 'seed-ppi-demo' },
    update: {},
    create: {
      id: 'seed-ppi-demo',
      order: 1,
      budgetId: budget.id,
      amount: 2500,
      type: PaymentPlanType.PERCENTAGE,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // 8️⃣ Obligations
  await prisma.obligation.upsert({
    where: { paymentPlanItemId: 'seed-ppi-demo' },
    update: {},
    create: {
      id: 'seed-obligation-demo',
      amount: 2500,
      currency: Currency.USD,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: ObligationStatus.PENDING,
      clientId: client.id,
      budgetId: budget.id,
      paymentPlanItemId: 'seed-ppi-demo',
    },
  });

  // 9️⃣ KanbanColumns
  const column = await prisma.kanbanColumn.upsert({
    where: { area_name: { area: KanbanArea.MARKETING, name: 'Backlog' } },
    update: {},
    create: {
      name: 'Backlog',
      area: KanbanArea.MARKETING,
      order: 1,
      color: '#00FF00',
    },
  });

  // 10️⃣ Tasks
  await prisma.task.upsert({
    where: { id: 'seed-task-demo' },
    update: {},
    create: {
      id: 'seed-task-demo',
      title: 'Tarea Demo',
      description: 'Tarea de prueba',
      priority: TaskPriority.MEDIUM,
      kanbanColumnId: column.id,
      clientId: client.id,
      systemId: system.id,
      assignedToId: adminUser.id,
      createdById: adminUser.id,
    },
  });

  // 11️⃣ FinancialMovements
  await prisma.financialMovement.upsert({
    where: { id: 'seed-movement-demo' },
    update: {},
    create: {
      id: 'seed-movement-demo',
      type: MovementType.INCOME,
      amount: 2500,
      currency: Currency.USD,
      description: 'Pago inicial',
      paymentMethod: PaymentMethod.TRANSFER,
      date: new Date(),
      clientId: client.id,
      obligationId: 'seed-obligation-demo',
    },
  });

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });