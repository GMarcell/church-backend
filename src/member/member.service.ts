import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';

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
}
