import { ClientStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class QueryClientDto {
  // Partial match against name, email, and company (case-insensitive)
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(ClientStatus, {
    message: 'status must be ACTIVE, INACTIVE or AT_RISK',
  })
  @IsOptional()
  status?: ClientStatus;

  // Filter by a single tag ID
  @IsString()
  @IsOptional()
  tagId?: string;

  // When true, soft-deleted clients are included in the results
  @Transform(({ value }: { value: string }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  includeDeleted?: boolean;
}
