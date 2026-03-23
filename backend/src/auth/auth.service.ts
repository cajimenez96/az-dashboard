import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../common/types/jwt-payload.interface';
import { LoginDto } from './dto/login.dto';

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    profile: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponse> {
    // 1. Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // 2. Generic error — never reveal whether email or password failed
    if (!user) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    // 3. Compare password against stored hash
    const passwordValid = await bcrypt.compare(dto.password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    // 4. Build JWT payload — role and profile come from DB, never from client
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile,
    };

    // 5. Sign token
    const access_token = this.jwtService.sign(payload);

    // 6. Return token + safe user object (password is intentionally omitted)
    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile: user.profile,
        // NOTE: password is NEVER included in any response
      },
    };
  }
}
