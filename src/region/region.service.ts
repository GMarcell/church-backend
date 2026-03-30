import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';

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

  findAll() {
    return this.prisma.region.findMany({
      include: {
        branch: true,
        families: true,
      },
    });
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
