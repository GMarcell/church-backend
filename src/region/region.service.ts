import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async create(dto: CreateRegionDto) {
    const region = await this.prisma.region.create({
      data: {
        name: dto.name,
        branch: {
          connect: { id: dto.branchId },
        },
      },
    });

    return this.findOneOrThrow(region.id);
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
          coordinator: {
            include: {
              family: true,
            },
          },
        },
      }),
      this.prisma.region.count(),
    ]);

    return createPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string) {
    return this.prisma.region.findUnique({
      where: { id },
      include: {
        branch: true,
        families: true,
        coordinator: {
          include: {
            family: true,
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateRegionDto) {
    await this.prisma.region.update({
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

    return this.findOneOrThrow(id);
  }

  remove(id: string) {
    return this.prisma.region.delete({
      where: { id },
    });
  }

  async assignCoordinator(regionId: string, coordinatorId: string | null) {
    const region = await this.prisma.region.findUniqueOrThrow({
      where: { id: regionId },
    });

    if (coordinatorId === null) {
      await this.prisma.region.update({
        where: { id: regionId },
        data: {
          coordinator: {
            disconnect: true,
          },
        },
      });

      return this.findOneOrThrow(regionId);
    }

    const coordinator = await this.prisma.member.findUnique({
      where: { id: coordinatorId },
      include: {
        family: {
          select: {
            regionId: true,
          },
        },
        coordinatedRegion: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!coordinator) {
      throw new NotFoundException('Coordinator member not found');
    }

    if (coordinator.family.regionId !== regionId) {
      throw new BadRequestException(
        'Coordinator member must belong to the same region',
      );
    }

    if (
      coordinator.coordinatedRegion &&
      coordinator.coordinatedRegion.id !== region.id
    ) {
      throw new BadRequestException(
        'This member is already assigned as coordinator for another region',
      );
    }

    await this.prisma.region.update({
      where: { id: regionId },
      data: {
        coordinator: {
          connect: { id: coordinatorId },
        },
      },
    });

    return this.findOneOrThrow(regionId);
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
        coordinator: {
          select: {
            id: true,
            name: true,
            email: true,
            familyId: true,
          },
        },
      },
    });

    return regions.map((r) => ({
      id: r.id,
      regionName: r.name,
      totalFamilies: r._count.families,
      coordinator: r.coordinator,
    }));
  }

  private async findOneOrThrow(id: string) {
    const region = await this.findOne(id);

    if (!region) {
      throw new NotFoundException('Region not found');
    }

    return region;
  }
}
