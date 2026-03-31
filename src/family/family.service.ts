import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import {
  createPaginatedResult,
  getPaginationParams,
} from '../common/utils/pagination.util';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class FamilyService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateFamilyDto) {
    return this.prisma.family.create({
      data: {
        familyName: dto.familyName,
        address: dto.address,
        region: {
          connect: { id: dto.regionId },
        },
        ...(dto.members?.length
          ? {
              members: {
                create: dto.members.map((member) => ({
                  ...member,
                  birthDate: new Date(member.birthDate),
                })),
              },
            }
          : {}),
      },
      include: {
        region: true,
        members: true,
      },
    });
  }

  async findAll(query: PaginationQueryDto) {
    const { page, limit, skip } = getPaginationParams(query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.family.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          region: true,
          members: true,
        },
      }),
      this.prisma.family.count(),
    ]);

    return createPaginatedResult(items, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.family.findUnique({
      where: { id },
      include: {
        region: true,
        members: true,
      },
    });
  }

  update(id: string, dto: UpdateFamilyDto) {
    return this.prisma.family.update({
      where: { id },
      data: {
        ...(dto.familyName !== undefined && { familyName: dto.familyName }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.regionId !== undefined && {
          region: {
            connect: { id: dto.regionId },
          },
        }),
      },
    });
  }

  remove(id: string) {
    return this.prisma.family.delete({
      where: { id },
    });
  }

  async countAll() {
    const all = await this.prisma.family.count();

    return {
      all,
    };
  }
}
