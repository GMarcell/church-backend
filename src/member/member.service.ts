import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { Gender, Member, MemberRole, Prisma } from '@prisma/client';
import { UpdateMemberDto } from './dto/update-member.dto';
import {
  createPaginatedResult,
  getPaginationParams,
} from '../common/utils/pagination.util';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { MemberPelkat } from './member-pelkat.enum';

type MemberWithPelkat = Member & { pelkat: string };

@Injectable()
export class MemberService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateMemberDto) {
    const member = await this.prisma.member.create({
      data: {
        ...dto,
        birthDate: new Date(dto.birthDate),
      },
    });

    return this.attachPelkat(member);
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

    return createPaginatedResult(
      items.map((member) => this.attachPelkat(member)),
      total,
      page,
      limit,
    );
  }

  async findByPelkat(pelkat: MemberPelkat, query: PaginationQueryDto) {
    const { page, limit, skip } = getPaginationParams(query);
    const where = this.buildPelkatWhere(pelkat);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          family: true,
        },
      }),
      this.prisma.member.count({ where }),
    ]);

    return createPaginatedResult(
      items.map((member) => this.attachPelkat(member)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: string) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: {
        family: true,
      },
    });

    return member ? this.attachPelkat(member) : null;
  }

  async update(id: string, dto: UpdateMemberDto) {
    const member = await this.prisma.member.update({
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

    return this.attachPelkat(member);
  }

  async findFamilyRegionId(familyId: string) {
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      select: {
        regionId: true,
      },
    });

    return family?.regionId;
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

  async countByPelkat(pelkat: MemberPelkat) {
    const total = await this.prisma.member.count({
      where: this.buildPelkatWhere(pelkat),
    });

    return {
      pelkat,
      total,
    };
  }

  async countAllPelkat() {
    const pelkats = Object.values(MemberPelkat);
    const counts = await this.prisma.$transaction(
      pelkats.map((pelkat) =>
        this.prisma.member.count({
          where: this.buildPelkatWhere(pelkat),
        }),
      ),
    );

    return {
      total: counts.reduce((sum, count) => sum + count, 0),
      items: pelkats.map((pelkat, index) => ({
        pelkat,
        total: counts[index],
      })),
    };
  }

  private attachPelkat<T extends Member>(member: T): T & MemberWithPelkat {
    return {
      ...member,
      pelkat: this.determinePelkat(member),
    };
  }

  private determinePelkat(
    member: Pick<Member, 'birthDate' | 'gender' | 'role'>,
  ) {
    const age = this.calculateAge(member.birthDate);
    const isMarried =
      member.role === MemberRole.FAMILY_HEAD || member.role === MemberRole.WIFE;

    if (isMarried && age < 36) {
      return member.gender === Gender.MALE
        ? MemberPelkat.PERSEKUTUAN_KAUM_BAPAK
        : MemberPelkat.PERSEKUTUAN_KAUM_PEREMPUAN;
    }

    if (age <= 12) {
      return MemberPelkat.PELAYANAN_ANAK;
    }

    if (age <= 16) {
      return MemberPelkat.PERSEKUTUAN_TARUNA;
    }

    if (age <= 35) {
      return MemberPelkat.GERAKAN_PEMUDA;
    }

    if (age <= 59) {
      return member.gender === Gender.MALE
        ? MemberPelkat.PERSEKUTUAN_KAUM_BAPAK
        : MemberPelkat.PERSEKUTUAN_KAUM_PEREMPUAN;
    }

    return MemberPelkat.PERSEKUTUAN_KAUM_LANJUT_USIA;
  }

  private calculateAge(birthDate: Date) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age -= 1;
    }

    return age;
  }

  private buildPelkatWhere(pelkat: MemberPelkat): Prisma.MemberWhereInput {
    const isMarriedWhere: Prisma.MemberWhereInput = {
      role: {
        in: [MemberRole.FAMILY_HEAD, MemberRole.WIFE],
      },
    };

    switch (pelkat) {
      case MemberPelkat.PELAYANAN_ANAK:
        return {
          birthDate: this.getBirthDateBetweenAges(0, 12),
          NOT: isMarriedWhere,
        };
      case MemberPelkat.PERSEKUTUAN_TARUNA:
        return {
          birthDate: this.getBirthDateBetweenAges(13, 16),
          NOT: isMarriedWhere,
        };
      case MemberPelkat.GERAKAN_PEMUDA:
        return {
          birthDate: this.getBirthDateBetweenAges(17, 35),
          NOT: isMarriedWhere,
        };
      case MemberPelkat.PERSEKUTUAN_KAUM_BAPAK:
        return {
          gender: Gender.MALE,
          OR: [
            {
              birthDate: this.getBirthDateBetweenAges(36, 59),
            },
            {
              birthDate: this.getBirthDateUnderAge(36),
              ...isMarriedWhere,
            },
          ],
        };
      case MemberPelkat.PERSEKUTUAN_KAUM_PEREMPUAN:
        return {
          gender: Gender.FEMALE,
          OR: [
            {
              birthDate: this.getBirthDateBetweenAges(36, 59),
            },
            {
              birthDate: this.getBirthDateUnderAge(36),
              ...isMarriedWhere,
            },
          ],
        };
      case MemberPelkat.PERSEKUTUAN_KAUM_LANJUT_USIA:
        return {
          birthDate: this.getBirthDateAtLeastAge(60),
        };
    }
  }

  private getBirthDateBetweenAges(minAge: number, maxAge: number) {
    return {
      gte: this.addDays(this.subtractYears(maxAge + 1), 1),
      lte: this.subtractYears(minAge),
    };
  }

  private getBirthDateUnderAge(age: number) {
    return {
      gte: this.addDays(this.subtractYears(age), 1),
      lte: new Date(),
    };
  }

  private getBirthDateAtLeastAge(age: number) {
    return {
      lte: this.subtractYears(age),
    };
  }

  private subtractYears(years: number) {
    const date = new Date();
    date.setFullYear(date.getFullYear() - years);
    return date;
  }

  private addDays(date: Date, days: number) {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }
}
