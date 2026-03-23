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
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { QueryBudgetDto } from './dto/query-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { UpdateBudgetStatusDto } from './dto/update-budget-status.dto';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  // ─────────────────────────────────────────────
  // POST /budgets   → 201
  // Creates budget + payment plan items atomically
  // ─────────────────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateBudgetDto, @CurrentUser() user: JwtPayload) {
    return this.budgetsService.create(dto, user.sub);
  }

  // ─────────────────────────────────────────────
  // GET /budgets   → 200
  // Supports: ?clientId= &status= &includeDeleted=
  // ─────────────────────────────────────────────
  @Get()
  findAll(@Query() query: QueryBudgetDto) {
    return this.budgetsService.findAll(query);
  }

  // ─────────────────────────────────────────────
  // GET /budgets/:id   → 200
  // Returns budget with client, payment plan items, and obligations
  // ─────────────────────────────────────────────
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.budgetsService.findOne(id);
  }

  // ─────────────────────────────────────────────
  // PATCH /budgets/:id   → 200
  // Update budget fields — DRAFT only
  // ─────────────────────────────────────────────
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.budgetsService.update(id, dto, user.sub);
  }

  // ─────────────────────────────────────────────
  // PATCH /budgets/:id/status   → 200
  // Lifecycle transition. ACCEPTED triggers obligation generation.
  // ACCEPTED and REJECTED are terminal — no further transitions.
  // ─────────────────────────────────────────────
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBudgetStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.budgetsService.updateStatus(id, dto, user.sub);
  }

  // ─────────────────────────────────────────────
  // DELETE /budgets/:id   → 204
  // Soft delete — DRAFT only, idempotent
  // ─────────────────────────────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<void> {
    return this.budgetsService.remove(id, user.sub);
  }
}
