import { Test, TestingModule } from '@nestjs/testing';
import { RegionService } from './region.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

describe('RegionService', () => {
  let service: RegionService;
  const prismaService = {
    region: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegionService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<RegionService>(RegionService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns coordinator data when fetching a single region', async () => {
    prismaService.region.findUnique.mockResolvedValue({
      id: 'region-1',
      name: 'Region A',
      branch: { id: 'branch-1', name: 'Central Branch' },
      families: [],
      users: [
        {
          id: 'user-1',
          email: 'coord@example.com',
          role: Role.COORDINATOR,
          regionId: 'region-1',
          createdAt: new Date('2026-04-02T00:00:00.000Z'),
        },
      ],
    });

    await expect(service.findOne('region-1')).resolves.toMatchObject({
      id: 'region-1',
      coordinator: {
        id: 'user-1',
        email: 'coord@example.com',
      },
    });
  });

  it('reassigns the coordinator for a region', async () => {
    prismaService.region.findUniqueOrThrow.mockResolvedValue({
      id: 'region-1',
    });
    prismaService.user.findUnique.mockResolvedValue({
      id: 'user-2',
      role: Role.COORDINATOR,
      regionId: null,
    });
    prismaService.user.updateMany.mockReturnValue('clear-existing');
    prismaService.user.update.mockReturnValue('assign-user');
    prismaService.$transaction.mockImplementation(
      async (operations) => operations,
    );
    prismaService.region.findUnique.mockResolvedValue({
      id: 'region-1',
      name: 'Region A',
      branch: { id: 'branch-1', name: 'Central Branch' },
      families: [],
      users: [
        {
          id: 'user-2',
          email: 'coord@example.com',
          role: Role.COORDINATOR,
          regionId: 'region-1',
          createdAt: new Date('2026-04-02T00:00:00.000Z'),
        },
      ],
    });

    await expect(
      service.assignCoordinator('region-1', 'user-2'),
    ).resolves.toMatchObject({
      id: 'region-1',
      coordinator: {
        id: 'user-2',
      },
    });

    expect(prismaService.user.updateMany).toHaveBeenCalledWith({
      where: {
        regionId: 'region-1',
        role: Role.COORDINATOR,
        NOT: {
          id: 'user-2',
        },
      },
      data: {
        regionId: null,
      },
    });
    expect(prismaService.user.update).toHaveBeenCalledWith({
      where: { id: 'user-2' },
      data: {
        region: {
          connect: { id: 'region-1' },
        },
      },
    });
  });
});
