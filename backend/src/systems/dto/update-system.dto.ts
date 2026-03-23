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

export class UpdateSystemDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @IsString()
  @MinLength(1)
  @IsOptional()
  clientId?: string;

  @IsEnum(SystemType)
  @IsOptional()
  type?: SystemType;

  @IsEnum(SystemStatus)
  @IsOptional()
  status?: SystemStatus;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null) return null;
    return typeof value === 'string' ? value.trim() : value;
  })
  @ValidateIf((_, v) => typeof v === 'string' && v.length > 0)
  @IsUrl({ require_protocol: true }, { message: 'repoUrl must be a valid URL' })
  repoUrl?: string | null;
}
