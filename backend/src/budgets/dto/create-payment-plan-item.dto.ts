import { PaymentPlanType } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsString, Matches, Min } from 'class-validator';

export class CreatePaymentPlanItemDto {
  @IsInt({ message: 'order must be an integer' })
  @Min(1, { message: 'order must be at least 1' })
  order: number;

  @IsEnum(PaymentPlanType, {
    message: 'type must be PERCENTAGE or FIXED',
  })
  type: PaymentPlanType;

  // Stored as string — Prisma converts to Decimal(12,2)
  // PERCENTAGE: value between 0 and 100 (validated in service)
  // FIXED: real monetary value
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount must be a positive number with up to 2 decimal places',
  })
  amount: string;

  @IsDateString({}, { message: 'dueDate must be a valid ISO 8601 date string' })
  dueDate: string;
}
