import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';

// ─────────────────────────────────────────────
// SELECT CONSTANT
// ─────────────────────────────────────────────

const ACTIVITY_LOG_SELECT = {
  id: true,
  action: true,
  entity: true,
  entityId: true,
  metadata: true,
  createdAt: true,
  user: {
    select: { id: true, name: true, email: true },
  },
} as const;

export interface LogParams {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ActivityLogService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────
  // LOG
  // Fire-and-forget friendly: always resolves, never rejects.
  // Call with `void this.activityLogService.log(...)` to avoid blocking.
  // ─────────────────────────────────────────────

  async log(params: LogParams): Promise<void> {
    try {
      await this.prisma.activityLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          metadata: params.metadata as Prisma.InputJsonValue ?? Prisma.JsonNull,
        },
      });
    } catch {
      // Intentionally silent — logging must never break the main flow
    }
  }

  // ─────────────────────────────────────────────
  // FIND ALL
  // SUPERADMIN-only access enforced at controller level.
  // ─────────────────────────────────────────────

  async findAll(query: QueryActivityLogDto) {
    const where: Prisma.ActivityLogWhereInput = {};

    if (query.entity) {
      where.entity = query.entity;
    }

    if (query.entityId) {
      where.entityId = query.entityId;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    return this.prisma.activityLog.findMany({
      where,
      select: ACTIVITY_LOG_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }
}
