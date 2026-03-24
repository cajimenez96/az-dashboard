import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateKanbanColumnDto {
  @IsString()
  @MinLength(1, { message: 'name must not be empty' })
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  color?: string;
}
