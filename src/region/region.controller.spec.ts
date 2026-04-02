import { Test, TestingModule } from '@nestjs/testing';
import { RegionController } from './region.controller';
import { RegionService } from './region.service';

describe('RegionController', () => {
  let controller: RegionController;
  const regionService = {
    assignCoordinator: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegionController],
      providers: [
        {
          provide: RegionService,
          useValue: regionService,
        },
      ],
    }).compile();

    controller = module.get<RegionController>(RegionController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('assigns a coordinator through the region service', () => {
    controller.assignCoordinator('region-1', {
      coordinatorId: 'user-1',
    });

    expect(regionService.assignCoordinator).toHaveBeenCalledWith(
      'region-1',
      'user-1',
    );
  });
});
