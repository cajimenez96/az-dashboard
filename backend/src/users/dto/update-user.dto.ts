import { Profile, Role } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

// Password is intentionally excluded — password changes are a separate flow
export class UpdateUserDto {
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @IsOptional()
  name?: string;

  @IsEnum(Role, { message: 'role must be a valid Role (SUPERADMIN, USER)' })
  @IsOptional()
  role?: Role;

  @IsEnum(Profile, {
    message: 'profile must be a valid Profile (MARKETER, DEVELOPER)',
  })
  @IsOptional()
  profile?: Profile;
}
