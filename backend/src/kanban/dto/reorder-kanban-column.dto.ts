import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class ReorderKanbanColumnDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'orderedIds must contain at least one id' })
  @IsString({ each: true })
  orderedIds: string[];
}
