import { Currency, ObligationStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateObligationDto {
  @IsString()
  clientId: string;

  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount must be a positive number with up to 2 decimal places',
  })
  amount: string;

  @IsEnum(Currency, { message: 'currency must be ARS or USD' })
  @IsOptional()
  currency?: Currency;

  @IsDateString({}, { message: 'dueDate must be a valid ISO 8601 date string' })
  dueDate: string;

  // Optional link to a budget for traceability (manual obligations may omit this)
  @IsString()
  @IsOptional()
  budgetId?: string;

  // Only used for seeding or admin correction — defaults to PENDING
  @IsEnum(ObligationStatus, { message: 'status must be PENDING or PAID' })
  @IsOptional()
  status?: ObligationStatus;
}
