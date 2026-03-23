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
import { ClientsService, SafeClient } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { QueryClientDto } from './dto/query-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  // ─────────────────────────────────────────────
  // POST /clients   → 201
  // ─────────────────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateClientDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SafeClient> {
    return this.clientsService.create(dto, user.sub);
  }

  // ─────────────────────────────────────────────
  // GET /clients   → 200
  // Supports: ?search= &status= &tagId= &includeDeleted=
  // ─────────────────────────────────────────────
  @Get()
  findAll(@Query() query: QueryClientDto): Promise<SafeClient[]> {
    return this.clientsService.findAll(query);
  }

  // ─────────────────────────────────────────────
  // GET /clients/:id   → 200
  // Includes resolved tags
  // ─────────────────────────────────────────────
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  // ─────────────────────────────────────────────
  // PATCH /clients/:id   → 200
  // ─────────────────────────────────────────────
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SafeClient> {
    return this.clientsService.update(id, dto, user.sub);
  }

  // ─────────────────────────────────────────────
  // DELETE /clients/:id   → 204
  // Soft delete — does not destroy the record
  // ─────────────────────────────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.clientsService.remove(id, user.sub);
  }
}
