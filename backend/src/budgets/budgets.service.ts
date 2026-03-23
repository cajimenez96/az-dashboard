import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BudgetStatus,
  Currency,
  ObligationStatus,
  PaymentPlanType,
  Prisma,
} from '@prisma/client';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { CreatePaymentPlanItemDto } from './dto/create-payment-plan-item.dto';
import { QueryBudgetDto } from './dto/query-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { UpdateBudgetStatusDto } from './dto/update-budget-status.dto';

// ─────────────────────────────────────────────
// SELECT CONSTANTS
// deletedAt is never returned outside the service
// ─────────────────────────────────────────────

const BUDGET_LIST_SELECT = {
  id: true,
  title: true,
  description: true,
  currency: true,
  totalAmount: true,
  status: true,
  clientId: true,
  client: {
    select: { id: true, name: true },
  },
  createdAt: true,
  updatedAt: true,
} as const;

const BUDGET_DETAIL_SELECT = {
  ...BUDGET_LIST_SELECT,
  paymentPlanItems: {
    select: {
      id: true,
      order: true,
      type: true,
      amount: true,
      dueDate: true,
    },
    orderBy: { order: 'asc' as const },
  },
  obligations: {
    select: {
      id: true,
      amount: true,
      currency: true,
      dueDate: true,
      status: true,
      paymentPlanItemId: true,
    },
  },
} as const;

// Statuses that lock the budget from further mutations
const IMMUTABLE_STATUSES: BudgetStatus[] = [
  BudgetStatus.ACCEPTED,
  BudgetStatus.REJECTED,
];

@Injectable()
export class BudgetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
  ) {}

  // ─────────────────────────────────────────────
  // PRIVATE: PAYMENT PLAN VALIDATION
  // ─────────────────────────────────────────────

  private validatePaymentPlanItems(
    items: CreatePaymentPlanItemDto[],
    totalAmount: Prisma.Decimal,
  ): void {
    const percentageItems = items.filter(
      (i) => i.type === PaymentPlanType.PERCENTAGE,
    );
    const fixedItems = items.filter((i) => i.type === PaymentPlanType.FIXED);

    // Each PERCENTAGE amount must be within 0–100
    for (const item of percentageItems) {
      const amount = new Prisma.Decimal(item.amount);
      if (amount.lt(0) || amount.gt(100)) {
        throw new BadRequestException('PERCENTAGE_OUT_OF_RANGE');
      }
    }

    // If all items are PERCENTAGE, they must sum exactly to 100
    if (percentageItems.length > 0 && fixedItems.length === 0) {
      const sum = percentageItems.reduce(
        (acc, item) => acc.add(new Prisma.Decimal(item.amount)),
        new Prisma.Decimal(0),
      );
      if (!sum.eq(100)) {
        throw new BadRequestException('PERCENTAGE_MUST_SUM_100');
      }
    }

    // Sum of FIXED items must not exceed totalAmount
    if (fixedItems.length > 0) {
      const sum = fixedItems.reduce(
        (acc, item) => acc.add(new Prisma.Decimal(item.amount)),
        new Prisma.Decimal(0),
      );
      if (sum.gt(totalAmount)) {
        throw new BadRequestException('FIXED_EXCEEDS_TOTAL');
      }
    }
  }

  // ─────────────────────────────────────────────
  // PRIVATE: RESOLVE ITEM AMOUNT
  // Converts PERCENTAGE items to real monetary value
  // ─────────────────────────────────────────────

  private resolveItemAmount(
    item: CreatePaymentPlanItemDto,
    totalAmount: Prisma.Decimal,
  ): Prisma.Decimal {
    if (item.type === PaymentPlanType.PERCENTAGE) {
      return totalAmount.mul(new Prisma.Decimal(item.amount)).div(100);
    }
    return new Prisma.Decimal(item.amount);
  }

  // ─────────────────────────────────────────────
  // PRIVATE: ASSERT BUDGET IS MUTABLE
  // Throws if the budget is in a closed state
  // ─────────────────────────────────────────────

  private assertMutable(status: BudgetStatus, errorCode: string): void {
    if (IMMUTABLE_STATUSES.includes(status)) {
      throw new BadRequestException(errorCode);
    }
  }

  // ─────────────────────────────────────────────
  // CREATE
  // Creates budget + payment plan items in a single transaction
  // ─────────────────────────────────────────────

  async create(dto: CreateBudgetDto, userId: string) {
    // Verify client exists and is not soft-deleted
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, deletedAt: null },
    });

    if (!client) {
      throw new NotFoundException('CLIENT_NOT_FOUND');
    }

    const totalAmount = new Prisma.Decimal(dto.totalAmount);

    // Validate payment plan before touching the DB
    this.validatePaymentPlanItems(dto.paymentPlanItems, totalAmount);

    const budget = await this.prisma.$transaction(async (tx) => {
      return tx.budget.create({
        data: {
          title: dto.title,
          description: dto.description,
          currency: dto.currency ?? Currency.ARS,
          totalAmount,
          clientId: dto.clientId,
          paymentPlanItems: {
            create: dto.paymentPlanItems.map((item) => ({
              order: item.order,
              type: item.type,
              amount: new Prisma.Decimal(item.amount),
              dueDate: new Date(item.dueDate),
            })),
          },
        },
        select: BUDGET_DETAIL_SELECT,
      });
    });

    void this.activityLog.log({
      userId,
      action: 'CREATE_BUDGET',
      entity: 'Budget',
      entityId: budget.id,
      metadata: { title: budget.title, totalAmount: budget.totalAmount.toString() },
    });

    return budget;
  }

  // ─────────────────────────────────────────────
  // LIST
  // ─────────────────────────────────────────────

  async findAll(query: QueryBudgetDto) {
    const where: Prisma.BudgetWhereInput = {};

    if (!query.includeDeleted) {
      where.deletedAt = null;
    }

    if (query.clientId) {
      where.clientId = query.clientId;
    }

    if (query.status) {
      where.status = query.status;
    }

    return this.prisma.budget.findMany({
      where,
      select: BUDGET_LIST_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─────────────────────────────────────────────
  // FIND ONE
  // Includes client, payment plan items, and obligations
  // ─────────────────────────────────────────────

  async findOne(id: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, deletedAt: null },
      select: BUDGET_DETAIL_SELECT,
    });

    if (!budget) {
      throw new NotFoundException('BUDGET_NOT_FOUND');
    }

    return budget;
  }

  // ─────────────────────────────────────────────
  // UPDATE FIELDS
  // Only allowed when status = DRAFT
  // ─────────────────────────────────────────────

  async update(id: string, dto: UpdateBudgetDto, userId: string) {
    const existing = await this.prisma.budget.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('BUDGET_NOT_FOUND');
    }

    this.assertMutable(existing.status, 'BUDGET_NOT_EDITABLE');

    if (existing.status !== BudgetStatus.DRAFT) {
      throw new BadRequestException('BUDGET_NOT_EDITABLE');
    }

    const budget = await this.prisma.budget.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        currency: dto.currency,
        totalAmount: dto.totalAmount
          ? new Prisma.Decimal(dto.totalAmount)
          : undefined,
      },
      select: BUDGET_DETAIL_SELECT,
    });

    void this.activityLog.log({
      userId,
      action: 'UPDATE_BUDGET',
      entity: 'Budget',
      entityId: id,
      metadata: { fields: Object.keys(dto) },
    });

    return budget;
  }

  // ─────────────────────────────────────────────
  // UPDATE STATUS
  // Handles lifecycle transitions.
  // ACCEPTED → auto-generates obligations (transaction)
  // ─────────────────────────────────────────────

  async updateStatus(id: string, dto: UpdateBudgetStatusDto, userId: string) {
    const existing = await this.prisma.budget.findFirst({
      where: { id, deletedAt: null },
      include: { paymentPlanItems: true },
    });

    if (!existing) {
      throw new NotFoundException('BUDGET_NOT_FOUND');
    }

    // ACCEPTED and REJECTED are terminal — no further transitions
    this.assertMutable(existing.status, 'BUDGET_ALREADY_CLOSED');

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.budget.update({
        where: { id },
        data: { status: dto.status },
        select: BUDGET_DETAIL_SELECT,
      });

      // Auto-generate one Obligation per PaymentPlanItem when ACCEPTED
      if (dto.status === BudgetStatus.ACCEPTED) {
        const obligations = existing.paymentPlanItems.map((item) => ({
          clientId: existing.clientId,
          budgetId: existing.id,
          paymentPlanItemId: item.id,
          currency: existing.currency,
          amount: this.resolveItemAmount(
            {
              order: item.order,
              type: item.type,
              amount: item.amount.toString(),
              dueDate: item.dueDate.toISOString(),
            },
            existing.totalAmount,
          ),
          dueDate: item.dueDate,
          status: ObligationStatus.PENDING,
        }));

        await tx.obligation.createMany({ data: obligations });
      }

      return updated;
    });

    const action =
      dto.status === BudgetStatus.ACCEPTED ? 'ACCEPT_BUDGET' :
      dto.status === BudgetStatus.REJECTED ? 'REJECT_BUDGET' :
      'UPDATE_BUDGET_STATUS';

    void this.activityLog.log({
      userId,
      action,
      entity: 'Budget',
      entityId: id,
      metadata: { status: dto.status },
    });

    return result;
  }

  // ─────────────────────────────────────────────
  // SOFT DELETE
  // Idempotent: already-deleted budgets are silently skipped
  // Only DRAFT budgets can be deleted
  // ─────────────────────────────────────────────

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.budget.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('BUDGET_NOT_FOUND');
    }

    // Already soft-deleted — idempotent no-op
    if (existing.deletedAt !== null) {
      return;
    }

    if (existing.status !== BudgetStatus.DRAFT) {
      throw new BadRequestException('BUDGET_NOT_DELETABLE');
    }

    await this.prisma.budget.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    void this.activityLog.log({
      userId,
      action: 'DELETE_BUDGET',
      entity: 'Budget',
      entityId: id,
    });
  }
}
