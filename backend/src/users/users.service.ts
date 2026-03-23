import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Profile, Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const BCRYPT_SALT_ROUNDS = 10;

// password is omitted from every outbound user object
export type SafeUser = Omit<User, 'password'>;

// Prisma select clause that always excludes password
const USER_SAFE_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  profile: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────

  async create(dto: CreateUserDto): Promise<SafeUser> {
    // Guard: email must be unique
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('EMAIL_ALREADY_EXISTS');
    }

    // Hash password before persisting — plain text must never reach the DB
    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        role: dto.role ?? Role.USER,
        profile: dto.profile ?? Profile.MARKETER,
      },
      select: USER_SAFE_SELECT,
    });

    return user;
  }

  // ─────────────────────────────────────────────
  // LIST
  // ─────────────────────────────────────────────

  async findAll(): Promise<SafeUser[]> {
    return this.prisma.user.findMany({
      select: USER_SAFE_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─────────────────────────────────────────────
  // GET CURRENT USER (from JWT sub)
  // ─────────────────────────────────────────────

  async findMe(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_SAFE_SELECT,
    });

    if (!user) {
      // Should not happen in practice — JWT sub always maps to an existing user
      throw new NotFoundException('USER_NOT_FOUND');
    }

    return user;
  }

  // ─────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────

  async update(id: string, dto: UpdateUserDto): Promise<SafeUser> {
    // Verify the user exists before attempting update
    const existing = await this.prisma.user.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: USER_SAFE_SELECT,
    });
  }
}
