import { PaymentPlanType } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';

// All fields optional — used for future sub-route: PATCH /budgets/:id/items/:itemId
// Only applicable when budget status = DRAFT
export class UpdatePaymentPlanItemDto {
  @IsInt({ message: 'order must be an integer' })
  @Min(1, { message: 'order must be at least 1' })
  @IsOptional()
  order?: number;

  @IsEnum(PaymentPlanType, {
    message: 'type must be PERCENTAGE or FIXED',
  })
  @IsOptional()
  type?: PaymentPlanType;

  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount must be a positive number with up to 2 decimal places',
  })
  @IsOptional()
  amount?: string;

  @IsDateString({}, { message: 'dueDate must be a valid ISO 8601 date string' })
  @IsOptional()
  dueDate?: string;
}
