import { Currency } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CreatePaymentPlanItemDto } from './create-payment-plan-item.dto';

export class CreateBudgetDto {
  @IsString()
  @MinLength(2, { message: 'title must be at least 2 characters' })
  title: string;

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
  totalAmount: string;

  @IsString({ message: 'clientId must be a string' })
  clientId: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'paymentPlanItems must contain at least one item' })
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentPlanItemDto)
  paymentPlanItems: CreatePaymentPlanItemDto[];
}
