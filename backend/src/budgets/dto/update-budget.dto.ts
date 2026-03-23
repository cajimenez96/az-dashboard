import { Currency } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';

// Only applicable when budget status = DRAFT
// Status transitions must go through PATCH /budgets/:id/status
export class UpdateBudgetDto {
  @IsString()
  @MinLength(2, { message: 'title must be at least 2 characters' })
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Currency, { message: 'currency must be ARS or USD' })
  @IsOptional()
  currency?: Currency;

  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'totalAmount must be a positive number with up to 2 decimal places',
  })
  @IsOptional()
  totalAmount?: string;
}
