import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MemberRole, Role } from '@prisma/client';
import { AuthPayload } from './interfaces/auth-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private formatDateAsPassword(date: Date) {
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();

    return `${day}-${month}-${year}`;
  }

  async register(
    email: string,
    password: string,
    role: Role,
    regionId?: string,
  ) {
    this.validateCoordinatorAssignment(role, regionId);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        ...(regionId !== undefined && {
          region: {
            connect: { id: regionId },
          },
        }),
      },
      include: {
        region: true,
      },
    });

    return {
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        regionId: user.regionId,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: AuthPayload = {
      sub: user.id,
      authType: 'user',
      email: user.email,
      role: user.role,
      regionId: user.regionId ?? undefined,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      token: accessToken,
      user: {
        email: user.email,
        role: user.role,
        regionId: user.regionId,
      },
    };
  }

  async memberLogin(name: string, password: string) {
    const members = await this.prisma.member.findMany({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
      include: {
        family: {
          select: {
            regionId: true,
          },
        },
        coordinatedRegion: {
          select: {
            id: true,
          },
        },
      },
    });

    const member = members.find(
      (item) => this.formatDateAsPassword(item.birthDate) === password,
    );

    if (!member) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: AuthPayload = {
      sub: member.id,
      authType: 'member',
      memberId: member.id,
      name: member.name,
      familyId: member.familyId,
      regionId: member.family.regionId,
      isRegionCoordinator: Boolean(member.coordinatedRegion),
      memberRole: member.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      token: accessToken,
      user: member.email
        ? {
            email: member.email,
          }
        : undefined,
      member: {
        id: member.id,
        name: member.name,
        role: member.role,
        regionId: member.family.regionId,
        isRegionCoordinator: Boolean(member.coordinatedRegion),
      },
    };
  }

  private validateCoordinatorAssignment(role: Role, regionId?: string) {
    if (role === Role.COORDINATOR && !regionId) {
      throw new BadRequestException(
        'Coordinator users must be assigned to a region',
      );
    }

    if (role !== Role.COORDINATOR && regionId) {
      throw new BadRequestException(
        'Only coordinator users can be assigned to a region',
      );
    }
  }
}
