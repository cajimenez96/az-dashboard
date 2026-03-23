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
import { FinancialService } from './financial.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { CreateObligationDto } from './dto/create-obligation.dto';
import { QueryMovementDto, QueryObligationDto } from './dto/query-financial.dto';
import { UpdateMovementDto } from './dto/update-movement.dto';
import { UpdateObligationDto } from './dto/update-obligation.dto';

@Controller('financial')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  // ═════════════════════════════════════════════
  // OBLIGATIONS
  // ═════════════════════════════════════════════

  // ─────────────────────────────────────────────
  // POST /financial/obligations   → 201
  // ─────────────────────────────────────────────
  @Post('obligations')
  @HttpCode(HttpStatus.CREATED)
  createObligation(@Body() dto: CreateObligationDto) {
    return this.financialService.createObligation(dto);
  }

  // ─────────────────────────────────────────────
  // GET /financial/obligations   → 200
  // Supports: ?clientId= &status= &dueBefore= &budgetId=
  // ─────────────────────────────────────────────
  @Get('obligations')
  findAllObligations(@Query() query: QueryObligationDto) {
    return this.financialService.findAllObligations(query);
  }

  // ─────────────────────────────────────────────
  // GET /financial/obligations/:id   → 200
  // Includes linked movements + totalPaid + remaining
  // ─────────────────────────────────────────────
  @Get('obligations/:id')
  findOneObligation(@Param('id') id: string) {
    return this.financialService.findOneObligation(id);
  }

  // ─────────────────────────────────────────────
  // PATCH /financial/obligations/:id   → 200
  // Only allowed when status = PENDING
  // ─────────────────────────────────────────────
  @Patch('obligations/:id')
  updateObligation(
    @Param('id') id: string,
    @Body() dto: UpdateObligationDto,
  ) {
    return this.financialService.updateObligation(id, dto);
  }

  // ─────────────────────────────────────────────
  // DELETE /financial/obligations/:id   → 204
  // Hard delete — only PENDING, manual obligations with no linked movements
  // ─────────────────────────────────────────────
  @Delete('obligations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeObligation(@Param('id') id: string): Promise<void> {
    return this.financialService.removeObligation(id);
  }

  // ═════════════════════════════════════════════
  // MOVEMENTS
  // ═════════════════════════════════════════════

  // ─────────────────────────────────────────────
  // POST /financial/movements   → 201
  // If obligationId provided, auto-evaluates obligation status after creation
  // ─────────────────────────────────────────────
  @Post('movements')
  @HttpCode(HttpStatus.CREATED)
  createMovement(@Body() dto: CreateMovementDto, @CurrentUser() user: JwtPayload) {
    return this.financialService.createMovement(dto, user.sub);
  }

  // ─────────────────────────────────────────────
  // GET /financial/movements   → 200
  // Supports: ?clientId= &type= &from= &to= &obligationId=
  // ─────────────────────────────────────────────
  @Get('movements')
  findAllMovements(@Query() query: QueryMovementDto) {
    return this.financialService.findAllMovements(query);
  }

  // ─────────────────────────────────────────────
  // GET /financial/movements/:id   → 200
  // ─────────────────────────────────────────────
  @Get('movements/:id')
  findOneMovement(@Param('id') id: string) {
    return this.financialService.findOneMovement(id);
  }

  // ─────────────────────────────────────────────
  // PATCH /financial/movements/:id   → 200
  // Amount changes on obligation-linked movements trigger obligation re-evaluation
  // ─────────────────────────────────────────────
  @Patch('movements/:id')
  updateMovement(
    @Param('id') id: string,
    @Body() dto: UpdateMovementDto,
  ) {
    return this.financialService.updateMovement(id, dto);
  }

  // ─────────────────────────────────────────────
  // DELETE /financial/movements/:id   → 204
  // Hard delete. If linked to obligation, obligation status is reverted if needed.
  // ─────────────────────────────────────────────
  @Delete('movements/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMovement(@Param('id') id: string): Promise<void> {
    return this.financialService.removeMovement(id);
  }
}
