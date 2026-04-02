import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
import { MarkMemberDeceasedDto } from './dto/mark-member-deceased.dto';
import { MarryMemberDto } from './dto/marry-member.dto';

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

  async markAsDeceased(id: string, dto: MarkMemberDeceasedDto) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: {
        family: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.isDeceased) {
      throw new BadRequestException('Member is already marked as deceased');
    }

    await this.prisma.$transaction(async (tx) => {
      if (member.role === MemberRole.FAMILY_HEAD) {
        await this.ensureReplacementFamilyHead(
          tx,
          member.familyId,
          id,
          dto.newFamilyHeadId,
        );
      }

      await tx.member.update({
        where: { id },
        data: {
          isActive: false,
          isDeceased: true,
          deathDate: dto.deathDate ? new Date(dto.deathDate) : new Date(),
          ...(member.role === MemberRole.FAMILY_HEAD && { role: MemberRole.OTHER }),
        },
      });
    });

    const updatedMember = await this.prisma.member.findUnique({
      where: { id },
      include: {
        family: true,
      },
    });

    return updatedMember ? this.attachPelkat(updatedMember) : null;
  }

  async createFamilyFromMarriage(id: string, dto: MarryMemberDto) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: {
        family: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.isDeceased || !member.isActive) {
      throw new BadRequestException(
        'Only active members can be moved into a new family',
      );
    }

    const roleInNewFamily =
      dto.roleInNewFamily ??
      (dto.spouse
        ? member.gender === Gender.MALE
          ? MemberRole.FAMILY_HEAD
          : MemberRole.WIFE
        : MemberRole.FAMILY_HEAD);

    if (
      roleInNewFamily !== MemberRole.FAMILY_HEAD &&
      roleInNewFamily !== MemberRole.WIFE
    ) {
      throw new BadRequestException(
        'roleInNewFamily must be FAMILY_HEAD or WIFE',
      );
    }

    const newFamily = await this.prisma.$transaction(async (tx) => {
      if (member.role === MemberRole.FAMILY_HEAD) {
        await this.ensureReplacementFamilyHead(
          tx,
          member.familyId,
          id,
          dto.newFamilyHeadId,
        );
      }

      const family = await tx.family.create({
        data: {
          familyName: dto.familyName,
          address: dto.address,
          region: {
            connect: { id: member.family.regionId },
          },
        },
      });

      await tx.member.update({
        where: { id },
        data: {
          family: {
            connect: { id: family.id },
          },
          role: roleInNewFamily,
        },
      });

      if (dto.spouse) {
        await tx.member.create({
          data: {
            name: dto.spouse.name,
            gender: dto.spouse.gender,
            birthDate: new Date(dto.spouse.birthDate),
            phone: dto.spouse.phone,
            email: dto.spouse.email,
            role:
              roleInNewFamily === MemberRole.FAMILY_HEAD
                ? MemberRole.WIFE
                : MemberRole.FAMILY_HEAD,
            family: {
              connect: { id: family.id },
            },
          },
        });
      }

      return tx.family.findUnique({
        where: { id: family.id },
        include: {
          region: true,
          members: true,
        },
      });
    });

    return newFamily;
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
        isActive: true,
        isDeceased: false,
      },
    });
    const male = await this.prisma.member.count({
      where: {
        gender: Gender.MALE,
        isActive: true,
        isDeceased: false,
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
    const activeLivingWhere: Prisma.MemberWhereInput = {
      isActive: true,
      isDeceased: false,
    };

    switch (pelkat) {
      case MemberPelkat.PELAYANAN_ANAK:
        return {
          ...activeLivingWhere,
          birthDate: this.getBirthDateBetweenAges(0, 12),
          NOT: isMarriedWhere,
        };
      case MemberPelkat.PERSEKUTUAN_TARUNA:
        return {
          ...activeLivingWhere,
          birthDate: this.getBirthDateBetweenAges(13, 16),
          NOT: isMarriedWhere,
        };
      case MemberPelkat.GERAKAN_PEMUDA:
        return {
          ...activeLivingWhere,
          birthDate: this.getBirthDateBetweenAges(17, 35),
          NOT: isMarriedWhere,
        };
      case MemberPelkat.PERSEKUTUAN_KAUM_BAPAK:
        return {
          ...activeLivingWhere,
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
          ...activeLivingWhere,
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
          ...activeLivingWhere,
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

  private async ensureReplacementFamilyHead(
    tx: Prisma.TransactionClient,
    familyId: string,
    excludedMemberId: string,
    newFamilyHeadId?: string,
  ) {
    const remainingMembers = await tx.member.findMany({
      where: {
        familyId,
        id: {
          not: excludedMemberId,
        },
        isActive: true,
        isDeceased: false,
      },
      select: {
        id: true,
      },
    });

    if (remainingMembers.length === 0) {
      return;
    }

    if (!newFamilyHeadId) {
      throw new BadRequestException(
        'A new family head is required when other active family members remain',
      );
    }

    const replacement = await tx.member.findFirst({
      where: {
        id: newFamilyHeadId,
        familyId,
        isActive: true,
        isDeceased: false,
      },
    });

    if (!replacement) {
      throw new BadRequestException(
        'Replacement family head must be an active member in the same family',
      );
    }

    await tx.member.update({
      where: { id: newFamilyHeadId },
      data: {
        role: MemberRole.FAMILY_HEAD,
      },
    });
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
