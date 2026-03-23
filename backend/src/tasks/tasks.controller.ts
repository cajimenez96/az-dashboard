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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { type JwtPayload } from '../common/types/jwt-payload.interface';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // ─────────────────────────────────────────────
  // POST /tasks   → 201
  // createdById resolved from JWT — not accepted from body
  // ─────────────────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createTask(@Body() dto: CreateTaskDto, @CurrentUser() user: JwtPayload) {
    return this.tasksService.createTask(dto, user.sub);
  }

  // ─────────────────────────────────────────────
  // GET /tasks   → 200
  // Supports: ?clientId= &systemId= &kanbanColumnId= &assignedToId= &priority= &dueBefore=
  // ─────────────────────────────────────────────
  @Get()
  findAllTasks(@Query() query: QueryTaskDto) {
    return this.tasksService.findAllTasks(query);
  }

  // ─────────────────────────────────────────────
  // GET /tasks/:id   → 200
  // Includes: kanbanColumn, client, system, assignedTo, createdBy
  // ─────────────────────────────────────────────
  @Get(':id')
  findOneTask(@Param('id') id: string) {
    return this.tasksService.findOneTask(id);
  }

  // ─────────────────────────────────────────────
  // PATCH /tasks/:id   → 200
  // Context constraint re-evaluated if clientId/systemId changes
  // ─────────────────────────────────────────────
  @Patch(':id')
  updateTask(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.updateTask(id, dto, user.sub);
  }

  // ─────────────────────────────────────────────
  // DELETE /tasks/:id   → 204
  // Soft delete — sets deletedAt. Idempotent.
  // ─────────────────────────────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTask(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.tasksService.removeTask(id, user.sub);
  }
}
