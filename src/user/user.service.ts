import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  createPaginatedResult,
  getPaginationParams,
} from '../common/utils/pagination.util';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
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
      }),
      this.prisma.user.count(),
    ]);

    return createPaginatedResult(items, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const data = {
      ...(dto.email !== undefined && { email: dto.email }),
      ...(dto.role !== undefined && { role: dto.role }),
      ...(dto.password !== undefined && {
        password: await bcrypt.hash(dto.password, 10),
      }),
    };

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
