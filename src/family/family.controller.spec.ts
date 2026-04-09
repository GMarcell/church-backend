import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { FamilyController } from './family.controller';
import { FamilyService } from './family.service';

describe('FamilyController', () => {
  let controller: FamilyController;
  const familyService = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FamilyController],
      providers: [
        {
          provide: FamilyService,
          useValue: familyService,
        },
      ],
    }).compile();

    controller = module.get<FamilyController>(FamilyController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('allows coordinators to update families in their own region', async () => {
    familyService.findOne.mockResolvedValue({
      id: 'family-1',
      regionId: 'region-1',
    });
    familyService.update.mockResolvedValue({
      id: 'family-1',
      familyName: 'Updated Family',
    });

    await expect(
      controller.update('family-1', { familyName: 'Updated Family' }, {
        user: {
          authType: 'user',
          role: 'COORDINATOR',
          regionId: 'region-1',
          email: 'coordinator@example.com',
          sub: 'user-1',
        },
      } as any),
    ).resolves.toEqual({
      id: 'family-1',
      familyName: 'Updated Family',
    });

    expect(familyService.update).toHaveBeenCalledWith('family-1', {
      familyName: 'Updated Family',
    });
  });

  it('blocks coordinators from updating families outside their region', async () => {
    familyService.findOne.mockResolvedValue({
      id: 'family-1',
      regionId: 'region-2',
    });

    await expect(
      controller.update('family-1', { familyName: 'Updated Family' }, {
        user: {
          authType: 'user',
          role: 'COORDINATOR',
          regionId: 'region-1',
          email: 'coordinator@example.com',
          sub: 'user-1',
        },
      } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(familyService.update).not.toHaveBeenCalled();
  });
});
