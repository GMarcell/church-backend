import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';

@Injectable()
export class BranchService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateBranchDto) {
    return this.prisma.branch.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.branch.findMany({
      include: {
        regions: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.branch.findUnique({
      where: { id },
      include: { regions: true },
    });
  }

  async remove(id: string) {
    return this.prisma.branch.delete({
      where: { id },
    });
  }
}
