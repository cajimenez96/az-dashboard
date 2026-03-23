import { Injectable, NotFoundException } from '@nestjs/common';
import { Client, Prisma } from '@prisma/client';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { QueryClientDto } from './dto/query-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

// deletedAt is never exposed outside the service layer
export type SafeClient = Omit<Client, 'deletedAt'>;

// Prisma select that always strips deletedAt from the response
const CLIENT_SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  company: true,
  notes: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  // deletedAt intentionally omitted
} as const;

// Tags are always included in single-client responses
const CLIENT_WITH_TAGS_SELECT = {
  ...CLIENT_SAFE_SELECT,
  tags: {
    select: {
      tag: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  },
} as const;

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
  ) {}

  // ─────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────

  async create(dto: CreateClientDto, userId: string): Promise<SafeClient> {
    const client = await this.prisma.client.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        company: dto.company,
        notes: dto.notes,
        status: dto.status,
      },
      select: CLIENT_SAFE_SELECT,
    });

    void this.activityLog.log({
      userId,
      action: 'CREATE_CLIENT',
      entity: 'Client',
      entityId: client.id,
      metadata: { name: client.name },
    });

    return client;
  }

  // ─────────────────────────────────────────────
  // LIST
  // ─────────────────────────────────────────────

  async findAll(query: QueryClientDto): Promise<SafeClient[]> {
    const where: Prisma.ClientWhereInput = {};

    // Soft-delete filter — default behaviour excludes deleted records
    if (!query.includeDeleted) {
      where.deletedAt = null;
    }

    // Status filter
    if (query.status) {
      where.status = query.status;
    }

    // Tag filter — client must have at least one ClientTag with this tagId
    if (query.tagId) {
      where.tags = { some: { tagId: query.tagId } };
    }

    // Case-insensitive partial match across name, email, and company
    if (query.search) {
      where.OR = [
        { name:    { contains: query.search, mode: 'insensitive' } },
        { email:   { contains: query.search, mode: 'insensitive' } },
        { company: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.client.findMany({
      where,
      select: CLIENT_SAFE_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─────────────────────────────────────────────
  // FIND ONE
  // ─────────────────────────────────────────────

  async findOne(id: string): Promise<SafeClient & { tags: { tag: { id: string; name: string; color: string | null } }[] }> {
    const client = await this.prisma.client.findFirst({
      where: { id, deletedAt: null },
      select: CLIENT_WITH_TAGS_SELECT,
    });

    if (!client) {
      throw new NotFoundException('CLIENT_NOT_FOUND');
    }

    return client;
  }

  // ─────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────

  async update(id: string, dto: UpdateClientDto, userId: string): Promise<SafeClient> {
    // Verify the client exists and has not been soft-deleted
    const existing = await this.prisma.client.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('CLIENT_NOT_FOUND');
    }

    const client = await this.prisma.client.update({
      where: { id },
      data: dto,
      select: CLIENT_SAFE_SELECT,
    });

    void this.activityLog.log({
      userId,
      action: 'UPDATE_CLIENT',
      entity: 'Client',
      entityId: id,
      metadata: { fields: Object.keys(dto) },
    });

    return client;
  }

  // ─────────────────────────────────────────────
  // SOFT DELETE
  // ─────────────────────────────────────────────

  async remove(id: string, userId: string): Promise<void> {
    // Idempotent: if already deleted, treat as success and return silently
    const existing = await this.prisma.client.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('CLIENT_NOT_FOUND');
    }

    // Already soft-deleted — no-op
    if (existing.deletedAt !== null) {
      return;
    }

    await this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    void this.activityLog.log({
      userId,
      action: 'DELETE_CLIENT',
      entity: 'Client',
      entityId: id,
    });
  }
}
