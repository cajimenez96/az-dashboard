import { Currency } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, Matches } from 'class-validator';

// Only allowed when obligation status = PENDING
// Status cannot be changed via this DTO — use PATCH /financial/obligations/:id/pay
export class UpdateObligationDto {
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount must be a positive number with up to 2 decimal places',
  })
  @IsOptional()
  amount?: string;

  @IsEnum(Currency, { message: 'currency must be ARS or USD' })
  @IsOptional()
  currency?: Currency;

  @IsDateString({}, { message: 'dueDate must be a valid ISO 8601 date string' })
  @IsOptional()
  dueDate?: string;
}
