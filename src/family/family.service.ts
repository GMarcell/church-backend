import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';

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
      },
    });
  }

  findAll() {
    return this.prisma.family.findMany({
      include: {
        region: true,
        members: true,
      },
    });
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
