import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { type JwtPayload } from '../common/types/jwt-payload.interface';
import { CreateSystemDto } from './dto/create-system.dto';
import { UpdateSystemDto } from './dto/update-system.dto';
import { SystemsService } from './systems.service';

@Controller('systems')
export class SystemsController {
  constructor(private readonly systemsService: SystemsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateSystemDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.systemsService.create(dto, user.sub);
  }

  @Get()
  findAll() {
    return this.systemsService.findAll();
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSystemDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.systemsService.update(id, dto, user.sub);
  }
}
