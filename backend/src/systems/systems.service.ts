import { Injectable, NotFoundException } from '@nestjs/common';
import { SystemStatus, SystemType } from '@prisma/client';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSystemDto } from './dto/create-system.dto';
import { UpdateSystemDto } from './dto/update-system.dto';

const SYSTEM_LIST_SELECT = {
  id: true,
  name: true,
  type: true,
  status: true,
  repoUrl: true,
  clientId: true,
  createdAt: true,
  updatedAt: true,
  client: {
    select: { id: true, name: true },
  },
} as const;

@Injectable()
export class SystemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async create(dto: CreateSystemDto, userId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, deletedAt: null },
    });
    if (!client) {
      throw new NotFoundException('CLIENT_NOT_FOUND');
    }

    const system = await this.prisma.system.create({
      data: {
        name: dto.name,
        type: dto.type,
        status: dto.status ?? SystemStatus.ACTIVE,
        repoUrl: dto.repoUrl?.trim() || null,
        clientId: dto.clientId,
      },
      select: SYSTEM_LIST_SELECT,
    });

    void this.activityLog.log({
      userId,
      action: 'CREATE_SYSTEM',
      entity: 'System',
      entityId: system.id,
      metadata: { name: system.name, type: system.type },
    });

    return system;
  }

  async findAll() {
    return this.prisma.system.findMany({
      where: { deletedAt: null },
      select: SYSTEM_LIST_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, dto: UpdateSystemDto, userId: string) {
    const existing = await this.prisma.system.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('SYSTEM_NOT_FOUND');
    }

    if (dto.clientId !== undefined) {
      const client = await this.prisma.client.findFirst({
        where: { id: dto.clientId, deletedAt: null },
      });
      if (!client) {
        throw new NotFoundException('CLIENT_NOT_FOUND');
      }
    }

    const system = await this.prisma.system.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.type !== undefined ? { type: dto.type as SystemType } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.repoUrl !== undefined ? { repoUrl: dto.repoUrl } : {}),
        ...(dto.clientId !== undefined ? { clientId: dto.clientId } : {}),
      },
      select: SYSTEM_LIST_SELECT,
    });

    void this.activityLog.log({
      userId,
      action: 'UPDATE_SYSTEM',
      entity: 'System',
      entityId: id,
      metadata: { fields: Object.keys(dto) },
    });

    return system;
  }
}
