import { BudgetStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class QueryBudgetDto {
  @IsString()
  @IsOptional()
  clientId?: string;

  @IsEnum(BudgetStatus, {
    message: 'status must be DRAFT, SENT, ACCEPTED or REJECTED',
  })
  @IsOptional()
  status?: BudgetStatus;

  // When true, soft-deleted budgets are included
  @Transform(({ value }: { value: string }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  includeDeleted?: boolean;
}
