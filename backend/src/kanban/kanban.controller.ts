import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateKanbanColumnDto } from './dto/create-kanban-column.dto';
import { QueryKanbanColumnDto } from './dto/query-kanban-column.dto';
import { UpdateKanbanColumnDto } from './dto/update-kanban-column.dto';
import { KanbanService } from './kanban.service';

@Controller('kanban-columns')
export class KanbanController {
  constructor(private readonly kanbanService: KanbanService) {}

  // ─────────────────────────────────────────────
  // POST /kanban-columns   → 201
  // SUPERADMIN only
  // ─────────────────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.SUPERADMIN)
  createColumn(@Body() dto: CreateKanbanColumnDto) {
    return this.kanbanService.createColumn(dto);
  }

  // ─────────────────────────────────────────────
  // GET /kanban-columns   → 200
  // All authenticated users. Supports: ?area=MARKETING|SOFTWARE
  // ─────────────────────────────────────────────
  @Get()
  findAllColumns(@Query() query: QueryKanbanColumnDto) {
    return this.kanbanService.findAllColumns(query);
  }

  // ─────────────────────────────────────────────
  // GET /kanban-columns/:id   → 200
  // Includes active tasks in the column
  // ─────────────────────────────────────────────
  @Get(':id')
  findOneColumn(@Param('id') id: string) {
    return this.kanbanService.findOneColumn(id);
  }

  // ─────────────────────────────────────────────
  // PATCH /kanban-columns/:id   → 200
  // SUPERADMIN only
  // ─────────────────────────────────────────────
  @Patch(':id')
  @Roles(Role.SUPERADMIN)
  updateColumn(
    @Param('id') id: string,
    @Body() dto: UpdateKanbanColumnDto,
  ) {
    return this.kanbanService.updateColumn(id, dto);
  }

  // ─────────────────────────────────────────────
  // DELETE /kanban-columns/:id   → 204
  // SUPERADMIN only. Hard delete — blocked if column has active tasks.
  // ─────────────────────────────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.SUPERADMIN)
  removeColumn(@Param('id') id: string): Promise<void> {
    return this.kanbanService.removeColumn(id);
  }
}
