import { Test, TestingModule } from '@nestjs/testing';
import { FamilyService } from './family.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FamilyService', () => {
  let service: FamilyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FamilyService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<FamilyService>(FamilyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
