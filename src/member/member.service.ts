import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { Gender } from '@prisma/client';
import { UpdateMemberDto } from './dto/update-member.dto';
import {
  createPaginatedResult,
  getPaginationParams,
} from '../common/utils/pagination.util';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class MemberService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateMemberDto) {
    return this.prisma.member.create({
      data: {
        ...dto,
        birthDate: new Date(dto.birthDate),
      },
    });
  }

  async findAll(query: PaginationQueryDto) {
    const { page, limit, skip } = getPaginationParams(query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.member.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          family: true,
        },
      }),
      this.prisma.member.count(),
    ]);

    return createPaginatedResult(items, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.member.findUnique({
      where: { id },
      include: {
        family: true,
      },
    });
  }

  update(id: string, dto: UpdateMemberDto) {
    return this.prisma.member.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
        ...(dto.birthDate !== undefined && {
          birthDate: new Date(dto.birthDate),
        }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.familyId !== undefined && {
          family: {
            connect: { id: dto.familyId },
          },
        }),
      },
    });
  }

  remove(id: string) {
    return this.prisma.member.delete({
      where: { id },
    });
  }

  async countAll() {
    const female = await this.prisma.member.count({
      where: {
        gender: Gender.FEMALE,
      },
    });
    const male = await this.prisma.member.count({
      where: {
        gender: Gender.MALE,
      },
    });

    const all = male + female;
    return {
      all,
      male,
      female,
    };
  }
}
