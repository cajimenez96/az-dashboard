import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { type JwtPayload } from '../common/types/jwt-payload.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SafeUser, UsersService } from './users.service';

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─────────────────────────────────────────────
  // GET /users/me   — any authenticated user
  // Must be declared BEFORE /:id to avoid route conflict
  // ─────────────────────────────────────────────
  @Get('me')
  getMe(@CurrentUser() user: JwtPayload): Promise<SafeUser> {
    return this.usersService.findMe(user.sub);
  }

  // ─────────────────────────────────────────────
  // GET /users   — SUPERADMIN only
  // ─────────────────────────────────────────────
  @Get()
  @Roles(Role.SUPERADMIN)
  findAll(): Promise<SafeUser[]> {
    return this.usersService.findAll();
  }

  // ─────────────────────────────────────────────
  // POST /users   — SUPERADMIN only
  // ─────────────────────────────────────────────
  @Post()
  @Roles(Role.SUPERADMIN)
  create(@Body() dto: CreateUserDto): Promise<SafeUser> {
    return this.usersService.create(dto);
  }

  // ─────────────────────────────────────────────
  // PATCH /users/:id   — SUPERADMIN only
  // ─────────────────────────────────────────────
  @Patch(':id')
  @Roles(Role.SUPERADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<SafeUser> {
    return this.usersService.update(id, dto);
  }
}
