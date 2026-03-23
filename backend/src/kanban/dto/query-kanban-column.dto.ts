import { KanbanArea } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class QueryKanbanColumnDto {
  @IsEnum(KanbanArea, { message: 'area must be MARKETING or SOFTWARE' })
  @IsOptional()
  area?: KanbanArea;
}
