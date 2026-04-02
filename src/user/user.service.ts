import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Prisma, Role } from '@prisma/client';
import {
  createPaginatedResult,
  getPaginationParams,
} from '../common/utils/pagination.util';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    this.validateCoordinatorAssignment(dto.role, dto.regionId);
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
        ...(dto.regionId !== undefined && {
          region: {
            connect: { id: dto.regionId },
          },
        }),
      },
      include: {
        region: true,
      },
    });
  }

  async findAll(query: PaginationQueryDto) {
    const { page, limit, skip } = getPaginationParams(query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          region: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    return createPaginatedResult(items, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        region: true,
      },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const existingUser = await this.prisma.user.findUniqueOrThrow({
      where: { id },
    });

    const nextRole = dto.role ?? existingUser.role;
    const nextRegionId =
      dto.regionId !== undefined ? dto.regionId : existingUser.regionId;

    this.validateCoordinatorAssignment(nextRole, nextRegionId);

    const data: Prisma.UserUpdateInput = {
      ...(dto.email !== undefined && { email: dto.email }),
      ...(dto.role !== undefined && { role: dto.role }),
      ...(dto.password !== undefined && {
        password: await bcrypt.hash(dto.password, 10),
      }),
      ...(dto.regionId !== undefined && {
        region:
          dto.regionId === null
            ? {
                disconnect: true,
              }
            : {
                connect: { id: dto.regionId },
              },
      }),
    };

    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        region: true,
      },
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  private validateCoordinatorAssignment(
    role: Role,
    regionId: string | null | undefined,
  ) {
    if (role === Role.COORDINATOR && !regionId) {
      throw new BadRequestException(
        'Coordinator users must be assigned to a region',
      );
    }

    if (role !== Role.COORDINATOR && regionId) {
      throw new BadRequestException(
        'Only coordinator users can be assigned to a region',
      );
    }
  }
}
