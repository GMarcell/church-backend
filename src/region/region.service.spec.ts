import { Test, TestingModule } from '@nestjs/testing';
import { RegionService } from './region.service';
import { PrismaService } from '../prisma/prisma.service';

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
    member: {
      findUnique: jest.fn(),
    },
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
      coordinator: {
        id: 'member-1',
        name: 'Coordinator Member',
        email: 'coord@example.com',
        family: {
          id: 'family-1',
          regionId: 'region-1',
        },
      },
    });

    await expect(service.findOne('region-1')).resolves.toMatchObject({
      id: 'region-1',
      coordinator: {
        id: 'member-1',
        email: 'coord@example.com',
      },
    });
  });

  it('reassigns the coordinator for a region', async () => {
    prismaService.region.findUniqueOrThrow.mockResolvedValue({
      id: 'region-1',
    });
    prismaService.member.findUnique.mockResolvedValue({
      id: 'member-2',
      family: {
        regionId: 'region-1',
      },
      coordinatedRegion: null,
    });
    prismaService.region.update.mockResolvedValue({
      id: 'region-1',
    });
    prismaService.region.findUnique.mockResolvedValue({
      id: 'region-1',
      name: 'Region A',
      branch: { id: 'branch-1', name: 'Central Branch' },
      families: [],
      coordinator: {
        id: 'member-2',
        name: 'Coordinator Member',
        email: 'coord@example.com',
        family: {
          id: 'family-2',
          regionId: 'region-1',
        },
      },
    });

    await expect(
      service.assignCoordinator('region-1', 'member-2'),
    ).resolves.toMatchObject({
      id: 'region-1',
      coordinator: {
        id: 'member-2',
      },
    });

    expect(prismaService.region.update).toHaveBeenCalledWith({
      where: { id: 'region-1' },
      data: {
        coordinator: {
          connect: { id: 'member-2' },
        },
      },
    });
  });
});
