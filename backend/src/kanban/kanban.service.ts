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
  // Uniqueness of [area, order] and [area, name] is enforced by the DB.
  // Prisma P2002 is caught and converted to a friendly ConflictException.
  // ─────────────────────────────────────────────

  async createColumn(dto: CreateKanbanColumnDto) {
    try {
      return await this.prisma.kanbanColumn.create({
        data: {
          name: dto.name,
          area: dto.area,
          order: dto.order,
          color: dto.color,
        },
        select: COLUMN_LIST_SELECT,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('COLUMN_NAME_OR_ORDER_ALREADY_EXISTS_IN_AREA');
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
  // Uniqueness violations converted to ConflictException.
  // ─────────────────────────────────────────────

  async updateColumn(id: string, dto: UpdateKanbanColumnDto) {
    const existing = await this.prisma.kanbanColumn.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('KANBAN_COLUMN_NOT_FOUND');
    }

    try {
      return await this.prisma.kanbanColumn.update({
        where: { id },
        data: {
          name: dto.name,
          area: dto.area,
          order: dto.order,
          color: dto.color,
        },
        select: COLUMN_LIST_SELECT,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('COLUMN_NAME_OR_ORDER_ALREADY_EXISTS_IN_AREA');
      }
      throw error;
    }
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
      throw new BadRequestException('COLUMN_HAS_ACTIVE_TASKS');
    }

    await this.prisma.kanbanColumn.delete({ where: { id } });
  }
}
