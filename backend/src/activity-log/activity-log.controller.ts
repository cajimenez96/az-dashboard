import { Controller, Get, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { ActivityLogService } from './activity-log.service';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';

@Controller('activity-logs')
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  // ─────────────────────────────────────────────
  // GET /activity-logs   → 200
  // SUPERADMIN only.
  // Supports: ?entity= &entityId= &userId=
  // ─────────────────────────────────────────────
  @Get()
  @Roles(Role.SUPERADMIN)
  findAll(@Query() query: QueryActivityLogDto) {
    return this.activityLogService.findAll(query);
  }
}
