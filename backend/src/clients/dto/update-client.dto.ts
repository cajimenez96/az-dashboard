import { ClientStatus } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateClientDto {
  @IsString()
  @MinLength(2, { message: 'name must be at least 2 characters' })
  @IsOptional()
  name?: string;

  @IsEmail({}, { message: 'Must be a valid email address' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(ClientStatus, {
    message: 'status must be ACTIVE, INACTIVE or AT_RISK',
  })
  @IsOptional()
  status?: ClientStatus;
}
