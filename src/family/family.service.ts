import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFamilyDto } from './dto/create-family.dto';

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

  remove(id: string) {
    return this.prisma.family.delete({
      where: { id },
    });
  }
}
