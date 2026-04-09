import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UserService', () => {
  let service: UserService;
  const prismaService = {
    user: {
      findFirst: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
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
      service.create({
        email: 'coordinator.regiona.2@example.com',
        password: 'secret123',
        role: Role.COORDINATOR,
        regionId: 'region-1',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prismaService.user.create).not.toHaveBeenCalled();
  });

  it('allows updating the existing coordinator without tripping the uniqueness check', async () => {
    prismaService.user.findUniqueOrThrow.mockResolvedValue({
      id: 'user-1',
      role: Role.COORDINATOR,
      regionId: 'region-1',
    });
    prismaService.user.findFirst.mockResolvedValue(null);
    prismaService.user.update.mockResolvedValue({
      id: 'user-1',
      email: 'coordinator.regiona@example.com',
      role: Role.COORDINATOR,
      regionId: 'region-1',
    });

    await expect(
      service.update('user-1', {
        email: 'coordinator.regiona@example.com',
      }),
    ).resolves.toMatchObject({
      id: 'user-1',
      role: Role.COORDINATOR,
      regionId: 'region-1',
    });

    expect(prismaService.user.findFirst).toHaveBeenCalledWith({
      where: {
        role: Role.COORDINATOR,
        regionId: 'region-1',
        id: {
          not: 'user-1',
        },
      },
    });
  });
});
