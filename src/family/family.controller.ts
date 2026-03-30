import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
} from '@nestjs/common';
import { FamilyService } from './family.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Controller('v1/families')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Post()
  create(@Body() dto: CreateFamilyDto) {
    return this.familyService.create(dto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.familyService.findAll(query);
  }

  @Get('count')
  countAll() {
    return this.familyService.countAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.familyService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFamilyDto) {
    return this.familyService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.familyService.remove(id);
  }
}
