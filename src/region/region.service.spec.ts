import { Test, TestingModule } from '@nestjs/testing';
import { RegionService } from './region.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RegionService', () => {
  let service: RegionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegionService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<RegionService>(RegionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
