import { Currency, MovementType, PaymentMethod } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class UpdateMovementDto {
  @IsEnum(MovementType, { message: 'type must be INCOME or EXPENSE' })
  @IsOptional()
  type?: MovementType;

  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount must be a positive number with up to 2 decimal places',
  })
  @IsOptional()
  amount?: string;

  @IsEnum(Currency, { message: 'currency must be ARS or USD' })
  @IsOptional()
  currency?: Currency;

  @IsEnum(PaymentMethod, {
    message: 'paymentMethod must be CASH, TRANSFER, CARD or OTHER',
  })
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsDateString({}, { message: 'date must be a valid ISO 8601 date string' })
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
