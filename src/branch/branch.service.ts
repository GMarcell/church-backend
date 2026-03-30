import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateBranchDto) {
    return this.prisma.branch.create({
      data: dto,
    });
  }

  findAll() {
    return this.prisma.branch.findMany({
      include: {
        regions: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.branch.findUnique({
      where: { id },
      include: {
        regions: true,
      },
    });
  }

  update(id: string, dto: UpdateBranchDto) {
    return this.prisma.branch.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: string) {
    return this.prisma.branch.delete({
      where: { id },
    });
  }

  async getRegionCountPerBranch() {
    const branches = await this.prisma.branch.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            regions: true,
          },
        },
      },
    });

    return branches.map((b) => ({
      id: b.id,
      branchName: b.name,
      totalRegions: b._count.regions,
    }));
  }
}
