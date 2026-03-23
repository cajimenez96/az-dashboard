import { TaskPriority } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateTaskDto {
  @IsString()
  @MinLength(2, { message: 'title must be at least 2 characters' })
  @IsOptional()
  title?: string;

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
  @IsOptional()
  kanbanColumnId?: string;

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
