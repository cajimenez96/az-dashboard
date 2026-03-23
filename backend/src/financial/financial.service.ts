import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Currency,
  ObligationStatus,
  Prisma,
} from '@prisma/client';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { CreateObligationDto } from './dto/create-obligation.dto';
import { QueryMovementDto, QueryObligationDto } from './dto/query-financial.dto';
import { UpdateMovementDto } from './dto/update-movement.dto';
import { UpdateObligationDto } from './dto/update-obligation.dto';

// ─────────────────────────────────────────────
// SELECT CONSTANTS
// ─────────────────────────────────────────────

const OBLIGATION_LIST_SELECT = {
  id: true,
  currency: true,
  amount: true,
  dueDate: true,
  status: true,
  clientId: true,
  budgetId: true,
  paymentPlanItemId: true,
  createdAt: true,
  updatedAt: true,
  client: {
    select: { id: true, name: true },
  },
} as const;

const OBLIGATION_DETAIL_SELECT = {
  ...OBLIGATION_LIST_SELECT,
  budget: {
    select: { id: true, title: true, status: true },
  },
  movements: {
    select: {
      id: true,
      type: true,
      amount: true,
      currency: true,
      paymentMethod: true,
      date: true,
      description: true,
      createdAt: true,
    },
    orderBy: { date: 'asc' as const },
  },
} as const;

const MOVEMENT_SELECT = {
  id: true,
  type: true,
  currency: true,
  amount: true,
  description: true,
  paymentMethod: true,
  date: true,
  clientId: true,
  obligationId: true,
  createdAt: true,
  client: {
    select: { id: true, name: true },
  },
  obligation: {
    select: { id: true, amount: true, status: true },
  },
} as const;

@Injectable()
export class FinancialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
  ) {}

  // ─────────────────────────────────────────────
  // PRIVATE: CHECK AND MARK OBLIGATION PAID
  // Called after every movement creation or amount update.
  // Uses injected tx to stay within the same transaction.
  // ─────────────────────────────────────────────

  private async checkAndMarkPaid(
    obligationId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const obligation = await tx.obligation.findUnique({
      where: { id: obligationId },
      include: {
        movements: { select: { amount: true } },
      },
    });

    if (!obligation) return;

    const totalPaid = obligation.movements.reduce(
      (sum, m) => sum.add(m.amount),
      new Prisma.Decimal(0),
    );

    if (totalPaid.gte(obligation.amount)) {
      await tx.obligation.update({
        where: { id: obligationId },
        data: { status: ObligationStatus.PAID },
      });
    }
  }

  // ═════════════════════════════════════════════
  // OBLIGATIONS
  // ═════════════════════════════════════════════

  // ─────────────────────────────────────────────
  // CREATE OBLIGATION (manual)
  // ─────────────────────────────────────────────

  async createObligation(dto: CreateObligationDto) {
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, deletedAt: null },
    });

    if (!client) {
      throw new NotFoundException('CLIENT_NOT_FOUND');
    }

    if (dto.budgetId) {
      const budget = await this.prisma.budget.findFirst({
        where: { id: dto.budgetId, deletedAt: null },
      });
      if (!budget) {
        throw new NotFoundException('BUDGET_NOT_FOUND');
      }
    }

    return this.prisma.obligation.create({
      data: {
        clientId: dto.clientId,
        budgetId: dto.budgetId,
        amount: new Prisma.Decimal(dto.amount),
        currency: dto.currency ?? Currency.ARS,
        dueDate: new Date(dto.dueDate),
        status: dto.status ?? ObligationStatus.PENDING,
      },
      select: OBLIGATION_DETAIL_SELECT,
    });
  }

  // ─────────────────────────────────────────────
  // LIST OBLIGATIONS
  // ─────────────────────────────────────────────

  async findAllObligations(query: QueryObligationDto) {
    const where: Prisma.ObligationWhereInput = {};

    if (query.clientId) {
      where.clientId = query.clientId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.budgetId) {
      where.budgetId = query.budgetId;
    }

    if (query.dueBefore) {
      where.dueDate = { lte: new Date(query.dueBefore) };
    }

    return this.prisma.obligation.findMany({
      where,
      select: OBLIGATION_LIST_SELECT,
      orderBy: { dueDate: 'asc' },
    });
  }

  // ─────────────────────────────────────────────
  // FIND ONE OBLIGATION
  // Includes linked movements + computed totalPaid and remaining
  // ─────────────────────────────────────────────

  async findOneObligation(id: string) {
    const obligation = await this.prisma.obligation.findUnique({
      where: { id },
      select: OBLIGATION_DETAIL_SELECT,
    });

    if (!obligation) {
      throw new NotFoundException('OBLIGATION_NOT_FOUND');
    }

    const totalPaid = obligation.movements.reduce(
      (sum, m) => sum.add(m.amount),
      new Prisma.Decimal(0),
    );

    const remaining = new Prisma.Decimal(obligation.amount).sub(totalPaid);

    return {
      ...obligation,
      totalPaid,
      remaining: remaining.lt(0) ? new Prisma.Decimal(0) : remaining,
    };
  }

  // ─────────────────────────────────────────────
  // UPDATE OBLIGATION
  // Only allowed when status = PENDING
  // ─────────────────────────────────────────────

  async updateObligation(id: string, dto: UpdateObligationDto) {
    const existing = await this.prisma.obligation.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('OBLIGATION_NOT_FOUND');
    }

    if (existing.status === ObligationStatus.PAID) {
      throw new BadRequestException('OBLIGATION_ALREADY_PAID');
    }

    return this.prisma.obligation.update({
      where: { id },
      data: {
        amount: dto.amount ? new Prisma.Decimal(dto.amount) : undefined,
        currency: dto.currency,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      select: OBLIGATION_DETAIL_SELECT,
    });
  }

  // ─────────────────────────────────────────────
  // REMOVE OBLIGATION (hard delete)
  // Only PENDING obligations with no linked movements can be deleted.
  // The schema has no deletedAt on Obligation — hard delete is the only option.
  // Obligations auto-generated from budgets (paymentPlanItemId != null) are protected.
  // ─────────────────────────────────────────────

  async removeObligation(id: string): Promise<void> {
    const existing = await this.prisma.obligation.findUnique({
      where: { id },
      include: { movements: { select: { id: true }, take: 1 } },
    });

    if (!existing) {
      throw new NotFoundException('OBLIGATION_NOT_FOUND');
    }

    if (existing.status === ObligationStatus.PAID) {
      throw new BadRequestException('OBLIGATION_ALREADY_PAID');
    }

    if (existing.paymentPlanItemId !== null) {
      throw new BadRequestException('OBLIGATION_GENERATED_FROM_BUDGET');
    }

    if (existing.movements.length > 0) {
      throw new BadRequestException('OBLIGATION_HAS_MOVEMENTS');
    }

    await this.prisma.obligation.delete({ where: { id } });
  }

  // ═════════════════════════════════════════════
  // FINANCIAL MOVEMENTS
  // ═════════════════════════════════════════════

  // ─────────────────────────────────────────────
  // CREATE MOVEMENT
  // If obligationId is provided, obligation is re-evaluated for auto-PAID.
  // Uses transaction to keep movement creation + status update atomic.
  // ─────────────────────────────────────────────

  async createMovement(dto: CreateMovementDto, userId: string) {
    if (dto.clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: dto.clientId, deletedAt: null },
      });
      if (!client) {
        throw new NotFoundException('CLIENT_NOT_FOUND');
      }
    }

    if (dto.obligationId) {
      const obligation = await this.prisma.obligation.findUnique({
        where: { id: dto.obligationId },
      });
      if (!obligation) {
        throw new NotFoundException('OBLIGATION_NOT_FOUND');
      }
      if (obligation.status === ObligationStatus.PAID) {
        throw new BadRequestException('OBLIGATION_ALREADY_PAID');
      }
    }

    const movement = await this.prisma.$transaction(async (tx) => {
      const created = await tx.financialMovement.create({
        data: {
          type: dto.type,
          amount: new Prisma.Decimal(dto.amount),
          currency: dto.currency ?? Currency.ARS,
          paymentMethod: dto.paymentMethod,
          date: new Date(dto.date),
          description: dto.description,
          clientId: dto.clientId,
          obligationId: dto.obligationId,
        },
        select: MOVEMENT_SELECT,
      });

      // Re-evaluate obligation after movement — may auto-mark as PAID
      if (dto.obligationId) {
        await this.checkAndMarkPaid(dto.obligationId, tx);
      }

      return created;
    });

    void this.activityLog.log({
      userId,
      action: 'CREATE_MOVEMENT',
      entity: 'FinancialMovement',
      entityId: movement.id,
      metadata: { type: movement.type, amount: movement.amount.toString() },
    });

    if (dto.obligationId) {
      void this.activityLog.log({
        userId,
        action: 'LINK_PAYMENT_TO_OBLIGATION',
        entity: 'Obligation',
        entityId: dto.obligationId,
        metadata: { movementId: movement.id, amount: movement.amount.toString() },
      });
    }

    return movement;
  }

  // ─────────────────────────────────────────────
  // LIST MOVEMENTS
  // ─────────────────────────────────────────────

  async findAllMovements(query: QueryMovementDto) {
    const where: Prisma.FinancialMovementWhereInput = {};

    if (query.clientId) {
      where.clientId = query.clientId;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.obligationId) {
      where.obligationId = query.obligationId;
    }

    if (query.from || query.to) {
      where.date = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to   ? { lte: new Date(query.to)   } : {}),
      };
    }

    return this.prisma.financialMovement.findMany({
      where,
      select: MOVEMENT_SELECT,
      orderBy: { date: 'desc' },
    });
  }

  // ─────────────────────────────────────────────
  // FIND ONE MOVEMENT
  // ─────────────────────────────────────────────

  async findOneMovement(id: string) {
    const movement = await this.prisma.financialMovement.findUnique({
      where: { id },
      select: MOVEMENT_SELECT,
    });

    if (!movement) {
      throw new NotFoundException('MOVEMENT_NOT_FOUND');
    }

    return movement;
  }

  // ─────────────────────────────────────────────
  // UPDATE MOVEMENT
  // If amount changes and movement is linked to an obligation,
  // re-evaluate the obligation status within a transaction.
  // ─────────────────────────────────────────────

  async updateMovement(id: string, dto: UpdateMovementDto) {
    const existing = await this.prisma.financialMovement.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('MOVEMENT_NOT_FOUND');
    }

    const amountChanged = dto.amount !== undefined;
    const isLinkedToObligation = existing.obligationId !== null;

    if (amountChanged && isLinkedToObligation) {
      // Changing a linked movement's amount may affect obligation status
      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.financialMovement.update({
          where: { id },
          data: {
            type: dto.type,
            amount: new Prisma.Decimal(dto.amount!),
            currency: dto.currency,
            paymentMethod: dto.paymentMethod,
            date: dto.date ? new Date(dto.date) : undefined,
            description: dto.description,
          },
          select: MOVEMENT_SELECT,
        });

        await this.checkAndMarkPaid(existing.obligationId!, tx);
        return updated;
      });
    }

    return this.prisma.financialMovement.update({
      where: { id },
      data: {
        type: dto.type,
        amount: dto.amount ? new Prisma.Decimal(dto.amount) : undefined,
        currency: dto.currency,
        paymentMethod: dto.paymentMethod,
        date: dto.date ? new Date(dto.date) : undefined,
        description: dto.description,
      },
      select: MOVEMENT_SELECT,
    });
  }

  // ─────────────────────────────────────────────
  // REMOVE MOVEMENT (hard delete)
  // The schema has no deletedAt on FinancialMovement.
  // Deleting a movement linked to an obligation will revert obligation to PENDING if needed.
  // ─────────────────────────────────────────────

  async removeMovement(id: string): Promise<void> {
    const existing = await this.prisma.financialMovement.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('MOVEMENT_NOT_FOUND');
    }

    const obligationId = existing.obligationId;

    if (obligationId) {
      // Delete movement + revert obligation status atomically
      return this.prisma.$transaction(async (tx) => {
        await tx.financialMovement.delete({ where: { id } });

        // Re-evaluate obligation: remaining movements may no longer cover the amount
        const obligation = await tx.obligation.findUnique({
          where: { id: obligationId },
          include: { movements: { select: { amount: true } } },
        });

        if (obligation) {
          const totalPaid = obligation.movements.reduce(
            (sum, m) => sum.add(m.amount),
            new Prisma.Decimal(0),
          );

          if (
            obligation.status === ObligationStatus.PAID &&
            totalPaid.lt(obligation.amount)
          ) {
            await tx.obligation.update({
              where: { id: obligationId },
              data: { status: ObligationStatus.PENDING },
            });
          }
        }
      });
    }

    await this.prisma.financialMovement.delete({ where: { id } });
  }
}
