import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { Gender } from '@prisma/client';

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

  findAll() {
    return this.prisma.member.findMany({
      include: {
        family: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.member.findUnique({
      where: { id },
      include: {
        family: true,
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
