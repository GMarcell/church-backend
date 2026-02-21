import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFamilyDto } from './dto/create-family.dto';

@Injectable()
export class FamilyService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateFamilyDto) {
    return this.prisma.family.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.family.findMany({
      include: {
        region: true,
        members: true,
      },
    });
  }

  async findByRegion(regionId: string) {
    return this.prisma.family.findMany({
      where: { regionId },
    });
  }
}
