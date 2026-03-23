import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

// ─────────────────────────────────────────────
// SELECT CONSTANTS
// ─────────────────────────────────────────────

const TASK_SELECT = {
  id: true,
  title: true,
  description: true,
  priority: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  kanbanColumn: {
    select: { id: true, name: true, area: true, order: true, color: true },
  },
  client: {
    select: { id: true, name: true },
  },
  system: {
    select: { id: true, name: true, type: true },
  },
  assignedTo: {
    select: { id: true, name: true, email: true },
  },
  createdBy: {
    select: { id: true, name: true, email: true },
  },
} as const;

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
  ) {}

  // ─────────────────────────────────────────────
  // CREATE TASK
  // createdById injected from JWT — not accepted from body.
  // clientId or systemId is mandatory.
  // ─────────────────────────────────────────────

  async createTask(dto: CreateTaskDto, userId: string) {
    if (!dto.clientId && !dto.systemId) {
      throw new BadRequestException('TASK_REQUIRES_CLIENT_OR_SYSTEM');
    }

    const column = await this.prisma.kanbanColumn.findUnique({
      where: { id: dto.kanbanColumnId },
    });
    if (!column) {
      throw new NotFoundException('KANBAN_COLUMN_NOT_FOUND');
    }

    if (dto.clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: dto.clientId, deletedAt: null },
      });
      if (!client) {
        throw new NotFoundException('CLIENT_NOT_FOUND');
      }
    }

    if (dto.systemId) {
      const system = await this.prisma.system.findFirst({
        where: { id: dto.systemId, deletedAt: null },
      });
      if (!system) {
        throw new NotFoundException('SYSTEM_NOT_FOUND');
      }
    }

    if (dto.assignedToId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.assignedToId },
      });
      if (!user) {
        throw new NotFoundException('ASSIGNED_USER_NOT_FOUND');
      }
    }

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        kanbanColumnId: dto.kanbanColumnId,
        clientId: dto.clientId,
        systemId: dto.systemId,
        assignedToId: dto.assignedToId,
        createdById: userId,
      },
      select: TASK_SELECT,
    });

    void this.activityLog.log({
      userId,
      action: 'CREATE_TASK',
      entity: 'Task',
      entityId: task.id,
      metadata: { title: task.title, priority: task.priority },
    });

    return task;
  }

  // ─────────────────────────────────────────────
  // LIST TASKS
  // Excludes soft-deleted tasks.
  // Supports filters: clientId, systemId, kanbanColumnId, assignedToId, priority, dueBefore
  // ─────────────────────────────────────────────

  async findAllTasks(query: QueryTaskDto) {
    const where: Prisma.TaskWhereInput = { deletedAt: null };

    if (query.clientId) {
      where.clientId = query.clientId;
    }

    if (query.systemId) {
      where.systemId = query.systemId;
    }

    if (query.kanbanColumnId) {
      where.kanbanColumnId = query.kanbanColumnId;
    }

    if (query.assignedToId) {
      where.assignedToId = query.assignedToId;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.dueBefore) {
      where.dueDate = { lte: new Date(query.dueBefore) };
    }

    return this.prisma.task.findMany({
      where,
      select: TASK_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─────────────────────────────────────────────
  // FIND ONE TASK
  // ─────────────────────────────────────────────

  async findOneTask(id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, deletedAt: null },
      select: TASK_SELECT,
    });

    if (!task) {
      throw new NotFoundException('TASK_NOT_FOUND');
    }

    return task;
  }

  // ─────────────────────────────────────────────
  // UPDATE TASK
  // If clientId or systemId is updated, context constraint is re-evaluated.
  // dueDate must remain future if changed.
  // ─────────────────────────────────────────────

  async updateTask(id: string, dto: UpdateTaskDto, userId: string) {
    const existing = await this.prisma.task.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('TASK_NOT_FOUND');
    }

    // Resolve effective clientId and systemId after the update
    const effectiveClientId =
      dto.clientId !== undefined ? dto.clientId : existing.clientId;
    const effectiveSystemId =
      dto.systemId !== undefined ? dto.systemId : existing.systemId;

    if (!effectiveClientId && !effectiveSystemId) {
      throw new BadRequestException('TASK_REQUIRES_CLIENT_OR_SYSTEM');
    }

    if (dto.kanbanColumnId) {
      const column = await this.prisma.kanbanColumn.findUnique({
        where: { id: dto.kanbanColumnId },
      });
      if (!column) {
        throw new NotFoundException('KANBAN_COLUMN_NOT_FOUND');
      }
    }

    if (dto.clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: dto.clientId, deletedAt: null },
      });
      if (!client) {
        throw new NotFoundException('CLIENT_NOT_FOUND');
      }
    }

    if (dto.systemId) {
      const system = await this.prisma.system.findFirst({
        where: { id: dto.systemId, deletedAt: null },
      });
      if (!system) {
        throw new NotFoundException('SYSTEM_NOT_FOUND');
      }
    }

    if (dto.assignedToId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.assignedToId },
      });
      if (!user) {
        throw new NotFoundException('ASSIGNED_USER_NOT_FOUND');
      }
    }

    const isMoved =
      dto.kanbanColumnId !== undefined &&
      dto.kanbanColumnId !== existing.kanbanColumnId;

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        kanbanColumnId: dto.kanbanColumnId,
        clientId: dto.clientId,
        systemId: dto.systemId,
        assignedToId: dto.assignedToId,
      },
      select: TASK_SELECT,
    });

    void this.activityLog.log({
      userId,
      action: isMoved ? 'MOVE_TASK' : 'UPDATE_TASK',
      entity: 'Task',
      entityId: id,
      metadata: isMoved
        ? { from: existing.kanbanColumnId, to: dto.kanbanColumnId }
        : { fields: Object.keys(dto) },
    });

    return task;
  }

  // ─────────────────────────────────────────────
  // REMOVE TASK (soft delete)
  // Sets deletedAt to now(). Idempotent.
  // ─────────────────────────────────────────────

  async removeTask(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.task.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('TASK_NOT_FOUND');
    }

    if (existing.deletedAt !== null) {
      // Already soft-deleted — treat as no-op
      return;
    }

    await this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    void this.activityLog.log({
      userId,
      action: 'DELETE_TASK',
      entity: 'Task',
      entityId: id,
    });
  }
}
