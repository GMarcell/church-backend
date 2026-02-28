import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegionDto } from './dto/create-region.dto';

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

  remove(id: string) {
    return this.prisma.region.delete({
      where: { id },
    });
  }
}
