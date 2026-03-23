import { Currency, MovementType, PaymentMethod } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateMovementDto {
  @IsEnum(MovementType, { message: 'type must be INCOME or EXPENSE' })
  type: MovementType;

  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount must be a positive number with up to 2 decimal places',
  })
  amount: string;

  @IsEnum(Currency, { message: 'currency must be ARS or USD' })
  @IsOptional()
  currency?: Currency;

  @IsEnum(PaymentMethod, {
    message: 'paymentMethod must be CASH, TRANSFER, CARD or OTHER',
  })
  paymentMethod: PaymentMethod;

  // Real transaction date — distinct from createdAt (system entry date)
  @IsDateString({}, { message: 'date must be a valid ISO 8601 date string' })
  date: string;

  @IsString()
  @IsOptional()
  description?: string;

  // Optional — EXPENSE movements may have no client
  @IsString()
  @IsOptional()
  clientId?: string;

  // Optional — INCOME movements may be linked to an obligation
  // If provided, obligation.status is recalculated after creation
  @IsString()
  @IsOptional()
  obligationId?: string;
}
