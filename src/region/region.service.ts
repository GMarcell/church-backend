import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import {
  createPaginatedResult,
  getPaginationParams,
} from '../common/utils/pagination.util';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class RegionService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateRegionDto) {
    return this.prisma.region.create({
      data: {
        name: dto.name,
        branch: {
          connect: { id: dto.branchId },
        },
      },
    });
  }

  async findAll(query: PaginationQueryDto) {
    const { page, limit, skip } = getPaginationParams(query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.region.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          branch: true,
          families: true,
        },
      }),
      this.prisma.region.count(),
    ]);

    return createPaginatedResult(items, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.region.findUnique({
      where: { id },
      include: {
        branch: true,
        families: true,
      },
    });
  }

  update(id: string, dto: UpdateRegionDto) {
    return this.prisma.region.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.branchId !== undefined && {
          branch: {
            connect: { id: dto.branchId },
          },
        }),
      },
    });
  }

  remove(id: string) {
    return this.prisma.region.delete({
      where: { id },
    });
  }

  async getFamilyCountPerRegion() {
    const regions = await this.prisma.region.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            families: true,
          },
        },
      },
    });

    return regions.map((r) => ({
      id: r.id,
      regionName: r.name,
      totalFamilies: r._count.families,
    }));
  }
}
