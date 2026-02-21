import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegionDto } from './dto/create-region.dto';

@Injectable()
export class RegionService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateRegionDto) {
    return this.prisma.region.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.region.findMany({
      include: {
        branch: true,
        families: true,
      },
    });
  }

  async findByBranch(branchId: string) {
    return this.prisma.region.findMany({
      where: { branchId },
    });
  }
}
