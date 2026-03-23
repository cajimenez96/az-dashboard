import { BudgetStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateBudgetStatusDto {
  @IsEnum(BudgetStatus, {
    message: 'status must be DRAFT, SENT, ACCEPTED or REJECTED',
  })
  status: BudgetStatus;
}
