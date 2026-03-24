import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKanbanColumnDto } from './dto/create-kanban-column.dto';
import { QueryKanbanColumnDto } from './dto/query-kanban-column.dto';
import { ReorderKanbanColumnDto } from './dto/reorder-kanban-column.dto';
import { UpdateKanbanColumnDto } from './dto/update-kanban-column.dto';

// ─────────────────────────────────────────────
// SELECT CONSTANTS
// ─────────────────────────────────────────────

const COLUMN_LIST_SELECT = {
  id: true,
  name: true,
  area: true,
  order: true,
  color: true,
} as const;

const COLUMN_DETAIL_SELECT = {
  ...COLUMN_LIST_SELECT,
  tasks: {
    where: { deletedAt: null },
    select: {
      id: true,
      title: true,
      priority: true,
      dueDate: true,
      createdAt: true,
      client: { select: { id: true, name: true } },
      system: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

@Injectable()
export class KanbanService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────
  // CREATE COLUMN
  // order is auto-assigned as last + 1 within the area.
  // ─────────────────────────────────────────────

  async createColumn(dto: CreateKanbanColumnDto) {
    const name = dto.name.trim();

    // Auto-assign order: find the current max within the area
    const last = await this.prisma.kanbanColumn.findFirst({
      where: { area: dto.area },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const nextOrder = last ? last.order + 1 : 1;

    try {
      return await this.prisma.kanbanColumn.create({
        data: {
          name,
          area: dto.area,
          order: nextOrder,
          color: dto.color,
        },
        select: COLUMN_LIST_SELECT,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('COLUMN_NAME_ALREADY_EXISTS_IN_AREA');
      }
      throw error;
    }
  }

  // ─────────────────────────────────────────────
  // LIST COLUMNS
  // Ordered by area then position within each area.
  // ─────────────────────────────────────────────

  async findAllColumns(query: QueryKanbanColumnDto) {
    const where: Prisma.KanbanColumnWhereInput = {};

    if (query.area) {
      where.area = query.area;
    }

    return this.prisma.kanbanColumn.findMany({
      where,
      select: COLUMN_LIST_SELECT,
      orderBy: [{ area: 'asc' }, { order: 'asc' }],
    });
  }

  // ─────────────────────────────────────────────
  // FIND ONE COLUMN
  // Includes active (non-deleted) tasks.
  // ─────────────────────────────────────────────

  async findOneColumn(id: string) {
    const column = await this.prisma.kanbanColumn.findUnique({
      where: { id },
      select: COLUMN_DETAIL_SELECT,
    });

    if (!column) {
      throw new NotFoundException('KANBAN_COLUMN_NOT_FOUND');
    }

    return column;
  }

  // ─────────────────────────────────────────────
  // UPDATE COLUMN
  // Only name and color are editable.
  // area and order are immutable via this endpoint.
  // ─────────────────────────────────────────────

  async updateColumn(id: string, dto: UpdateKanbanColumnDto) {
    const existing = await this.prisma.kanbanColumn.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('KANBAN_COLUMN_NOT_FOUND');
    }

    const data: Prisma.KanbanColumnUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.color !== undefined) data.color = dto.color;

    try {
      return await this.prisma.kanbanColumn.update({
        where: { id },
        data,
        select: COLUMN_LIST_SELECT,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('COLUMN_NAME_ALREADY_EXISTS_IN_AREA');
      }
      throw error;
    }
  }

  // ─────────────────────────────────────────────
  // REORDER COLUMNS
  // Receives an ordered array of column IDs.
  // Assigns order = index + 1 to each.
  // All IDs must exist; operation runs in a transaction.
  // ─────────────────────────────────────────────

  async reorderColumns(dto: ReorderKanbanColumnDto): Promise<void> {
    const { orderedIds } = dto;

    // Verify all IDs exist
    const columns = await this.prisma.kanbanColumn.findMany({
      where: { id: { in: orderedIds } },
      select: { id: true },
    });

    if (columns.length !== orderedIds.length) {
      throw new NotFoundException('ONE_OR_MORE_COLUMN_IDS_NOT_FOUND');
    }

    // Two-pass approach to avoid @@unique([area, order]) conflicts mid-transaction:
    // Pass 1 → assign high temporary offsets (10000+) to free all target slots.
    // Pass 2 → assign final 1-based order values.
    const OFFSET = 10000;

    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx.kanbanColumn.update({
          where: { id: orderedIds[i] },
          data: { order: OFFSET + i + 1 },
        });
      }
      for (let i = 0; i < orderedIds.length; i++) {
        await tx.kanbanColumn.update({
          where: { id: orderedIds[i] },
          data: { order: i + 1 },
        });
      }
    });
  }

  // ─────────────────────────────────────────────
  // REMOVE COLUMN (hard delete)
  // Blocked if the column has any active (non-deleted) tasks.
  // KanbanColumn has no deletedAt in the schema.
  // ─────────────────────────────────────────────

  async removeColumn(id: string): Promise<void> {
    const existing = await this.prisma.kanbanColumn.findUnique({
      where: { id },
      include: {
        tasks: {
          where: { deletedAt: null },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('KANBAN_COLUMN_NOT_FOUND');
    }

    if (existing.tasks.length > 0) {
      throw new BadRequestException('COLUMN_HAS_TASKS');
    }

    await this.prisma.kanbanColumn.delete({ where: { id } });
  }
}
