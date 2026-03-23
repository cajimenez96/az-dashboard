import { TaskPriority } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MinLength(2, { message: 'title must be at least 2 characters' })
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskPriority, { message: 'priority must be LOW, MEDIUM, HIGH or URGENT' })
  @IsOptional()
  priority?: TaskPriority;

  @IsDateString({}, { message: 'dueDate must be a valid ISO 8601 date string' })
  @IsOptional()
  dueDate?: string;

  @IsString()
  kanbanColumnId: string;

  // At least one of clientId or systemId must be provided (validated in service)
  @IsString()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  systemId?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;
}
