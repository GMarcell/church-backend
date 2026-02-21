import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MemberService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.MemberCreateInput) {
    return this.prisma.member.create({ data });
  }

  findAll() {
    return this.prisma.member.findMany({
      include: {
        family: true,
      },
    });
  }
}
