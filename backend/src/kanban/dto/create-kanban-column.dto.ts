import { KanbanArea } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateKanbanColumnDto {
  @IsString()
  @MinLength(1, { message: 'name must not be empty' })
  name: string;

  @IsEnum(KanbanArea, { message: 'area must be MARKETING or SOFTWARE' })
  area: KanbanArea;

  @IsInt({ message: 'order must be an integer' })
  @Min(0, { message: 'order must be 0 or greater' })
  order: number;

  @IsString()
  @IsOptional()
  color?: string;
}
