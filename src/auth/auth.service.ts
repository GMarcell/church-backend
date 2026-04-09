import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { AuthPayload } from './interfaces/auth-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(
    email: string,
    password: string,
    role: Role,
    regionId?: string,
  ) {
    await this.validateCoordinatorAssignment(role, regionId);
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

  private async validateCoordinatorAssignment(role: Role, regionId?: string) {
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

    if (role !== Role.COORDINATOR || !regionId) {
      return;
    }

    const existingCoordinator = await this.prisma.user.findFirst({
      where: {
        role: Role.COORDINATOR,
        regionId,
      },
    });

    if (existingCoordinator) {
      throw new BadRequestException(
        'This region already has a coordinator user',
      );
    }
  }
}
