import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  const prismaService = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };
  const jwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects creating a second coordinator for the same region', async () => {
    prismaService.user.findFirst.mockResolvedValue({
      id: 'existing-coordinator',
    });

    await expect(
      service.register(
        'coordinator.regiona.2@example.com',
        'secret123',
        Role.COORDINATOR,
        'region-1',
      ),
    ).rejects.toThrow(BadRequestException);

    expect(prismaService.user.create).not.toHaveBeenCalled();
  });
});
