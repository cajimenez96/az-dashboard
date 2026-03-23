import { TaskPriority } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class QueryTaskDto {
  @IsString()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  systemId?: string;

  @IsString()
  @IsOptional()
  kanbanColumnId?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsEnum(TaskPriority, { message: 'priority must be LOW, MEDIUM, HIGH or URGENT' })
  @IsOptional()
  priority?: TaskPriority;

  // Return tasks with dueDate on or before this date (ISO 8601)
  @IsDateString()
  @IsOptional()
  dueBefore?: string;
}
