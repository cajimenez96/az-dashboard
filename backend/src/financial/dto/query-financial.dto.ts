import { MovementType, ObligationStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class QueryObligationDto {
  @IsString()
  @IsOptional()
  clientId?: string;

  @IsEnum(ObligationStatus, { message: 'status must be PENDING or PAID' })
  @IsOptional()
  status?: ObligationStatus;

  // Return obligations with dueDate before this date (ISO 8601)
  @IsDateString()
  @IsOptional()
  dueBefore?: string;

  @IsString()
  @IsOptional()
  budgetId?: string;
}

export class QueryMovementDto {
  @IsString()
  @IsOptional()
  clientId?: string;

  @IsEnum(MovementType, { message: 'type must be INCOME or EXPENSE' })
  @IsOptional()
  type?: MovementType;

  // Date range filter on the movement's real transaction date
  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;

  @IsString()
  @IsOptional()
  obligationId?: string;
}
