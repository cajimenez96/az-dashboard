import { IsOptional, IsString } from 'class-validator';

export class QueryActivityLogDto {
  @IsString()
  @IsOptional()
  entity?: string;

  @IsString()
  @IsOptional()
  entityId?: string;

  @IsString()
  @IsOptional()
  userId?: string;
}
