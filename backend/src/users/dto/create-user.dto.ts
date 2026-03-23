import { Profile, Role } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Must be a valid email address' })
  email: string;

  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  name: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsEnum(Role, { message: 'role must be a valid Role (SUPERADMIN, USER)' })
  @IsOptional()
  role?: Role;

  @IsEnum(Profile, {
    message: 'profile must be a valid Profile (MARKETER, DEVELOPER)',
  })
  @IsOptional()
  profile?: Profile;
}
