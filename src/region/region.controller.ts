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
import { RegionService } from './region.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Controller('v1/regions')
export class RegionController {
  constructor(private readonly regionService: RegionService) {}

  @Post()
  create(@Body() dto: CreateRegionDto) {
    return this.regionService.create(dto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.regionService.findAll(query);
  }

  @Get('count')
  getFamilyCountPerRegion() {
    return this.regionService.getFamilyCountPerRegion();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.regionService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRegionDto) {
    return this.regionService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.regionService.remove(id);
  }
}
