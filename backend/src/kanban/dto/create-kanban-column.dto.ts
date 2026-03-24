import { KanbanArea } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateKanbanColumnDto {
  @IsString()
  @MinLength(1, { message: 'name must not be empty' })
  name: string;

  @IsEnum(KanbanArea, { message: 'area must be MARKETING or SOFTWARE' })
  area: KanbanArea;

  @IsString()
  @IsOptional()
  color?: string;
}
