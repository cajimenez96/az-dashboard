import { SystemStatus, SystemType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateSystemDto {
  @IsString()
  @MinLength(2, { message: 'name must be at least 2 characters' })
  name: string;

  @IsString()
  @MinLength(1, { message: 'clientId is required' })
  clientId: string;

  @IsEnum(SystemType, { message: 'type must be SAAS or CUSTOM' })
  type: SystemType;

  @IsEnum(SystemStatus, {
    message: 'status must be ACTIVE, MAINTENANCE or DEPRECATED',
  })
  @IsOptional()
  status?: SystemStatus;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null) return undefined;
    return typeof value === 'string' ? value.trim() : value;
  })
  @ValidateIf((_, v) => typeof v === 'string' && v.length > 0)
  @IsUrl({ require_protocol: true }, { message: 'repoUrl must be a valid URL' })
  repoUrl?: string;
}
