import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RegionService } from './region.service';
import { CreateRegionDto } from './dto/create-region.dto';

@Controller('regions')
export class RegionController {
  constructor(private readonly regionService: RegionService) {}

  // Create Region
  @Post()
  async create(@Body() createRegionDto: CreateRegionDto) {
    return this.regionService.create(createRegionDto);
  }

  // Get All Regions (with branch & families)
  @Get()
  async findAll() {
    return this.regionService.findAll();
  }

  // Get Regions by Branch ID
  @Get('branch/:branchId')
  async findByBranch(@Param('branchId') branchId: string) {
    return this.regionService.findByBranch(branchId);
  }
}
