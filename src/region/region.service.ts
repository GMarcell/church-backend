import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
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
          users: {
            where: {
              role: Role.COORDINATOR,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      }),
      this.prisma.region.count(),
    ]);

    return createPaginatedResult(
      items.map((item) => this.attachCoordinator(item)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: string) {
    const region = await this.prisma.region.findUnique({
      where: { id },
      include: {
        branch: true,
        families: true,
        users: {
          where: {
            role: Role.COORDINATOR,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    return region ? this.attachCoordinator(region) : null;
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
    await this.prisma.region.findUniqueOrThrow({
      where: { id: regionId },
    });

    if (coordinatorId === null) {
      await this.prisma.user.updateMany({
        where: {
          regionId,
          role: Role.COORDINATOR,
        },
        data: {
          regionId: null,
        },
      });

      return this.findOneOrThrow(regionId);
    }

    const coordinator = await this.prisma.user.findUnique({
      where: { id: coordinatorId },
    });

    if (!coordinator) {
      throw new NotFoundException('Coordinator user not found');
    }

    if (coordinator.role !== Role.COORDINATOR) {
      throw new BadRequestException(
        'Only users with coordinator role can be assigned to a region',
      );
    }

    await this.prisma.$transaction([
      this.prisma.user.updateMany({
        where: {
          regionId,
          role: Role.COORDINATOR,
          NOT: {
            id: coordinatorId,
          },
        },
        data: {
          regionId: null,
        },
      }),
      this.prisma.user.update({
        where: { id: coordinatorId },
        data: {
          region: {
            connect: { id: regionId },
          },
        },
      }),
    ]);

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
      },
    });

    return regions.map((r) => ({
      id: r.id,
      regionName: r.name,
      totalFamilies: r._count.families,
    }));
  }

  private async findOneOrThrow(id: string) {
    const region = await this.findOne(id);

    if (!region) {
      throw new NotFoundException('Region not found');
    }

    return region;
  }

  private attachCoordinator<
    T extends {
      users?: Array<{
        id: string;
        email: string;
        role: Role;
        regionId: string | null;
        createdAt: Date;
      }>;
    },
  >(region: T) {
    const { users, ...rest } = region;
    const [coordinator] = users ?? [];

    return {
      ...rest,
      coordinator: coordinator ?? null,
    };
  }
}
