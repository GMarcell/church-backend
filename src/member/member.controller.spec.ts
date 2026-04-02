import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { MemberPelkat } from './member-pelkat.enum';

describe('MemberController', () => {
  let controller: MemberController;
  const memberService = {
    findByPelkat: jest.fn(),
    countAllPelkat: jest.fn(),
    countByPelkat: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    findFamilyRegionId: jest.fn(),
    markAsDeceased: jest.fn(),
    createFamilyFromMarriage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MemberController],
      providers: [
        {
          provide: MemberService,
          useValue: memberService,
        },
      ],
    }).compile();

    controller = module.get<MemberController>(MemberController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates pelkat filtering to the service', () => {
    controller.findByPelkat(MemberPelkat.GERAKAN_PEMUDA, {
      page: '1',
      limit: '10',
    });

    expect(memberService.findByPelkat).toHaveBeenCalledWith(
      MemberPelkat.GERAKAN_PEMUDA,
      {
        page: '1',
        limit: '10',
      },
    );
  });

  it('delegates pelkat aggregate counts to the service', () => {
    controller.countAllPelkat();

    expect(memberService.countAllPelkat).toHaveBeenCalled();
  });

  it('delegates single pelkat count to the service', () => {
    controller.countByPelkat(MemberPelkat.PERSEKUTUAN_KAUM_BAPAK);

    expect(memberService.countByPelkat).toHaveBeenCalledWith(
      MemberPelkat.PERSEKUTUAN_KAUM_BAPAK,
    );
  });

  it('allows coordinators to update members in their own region', async () => {
    memberService.findOne.mockResolvedValue({
      id: 'member-1',
      familyId: 'family-1',
      family: {
        id: 'family-1',
        regionId: 'region-1',
      },
    });
    memberService.update.mockResolvedValue({
      id: 'member-1',
      name: 'Updated Member',
    });

    await expect(
      controller.update('member-1', { name: 'Updated Member' }, {
        user: {
          authType: 'member',
          isRegionCoordinator: true,
          regionId: 'region-1',
          sub: 'member-99',
        },
      } as any),
    ).resolves.toEqual({
      id: 'member-1',
      name: 'Updated Member',
    });

    expect(memberService.update).toHaveBeenCalledWith('member-1', {
      name: 'Updated Member',
    });
  });

  it('blocks coordinators from moving members to another region', async () => {
    memberService.findOne.mockResolvedValue({
      id: 'member-1',
      familyId: 'family-1',
      family: {
        id: 'family-1',
        regionId: 'region-1',
      },
    });
    memberService.findFamilyRegionId.mockResolvedValue('region-2');

    await expect(
      controller.update('member-1', { familyId: 'family-2' }, {
        user: {
          authType: 'member',
          isRegionCoordinator: true,
          regionId: 'region-1',
          sub: 'member-99',
        },
      } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(memberService.update).not.toHaveBeenCalled();
  });

  it('delegates marking a member as deceased after authorization', async () => {
    memberService.findOne.mockResolvedValue({
      id: 'member-1',
      familyId: 'family-1',
      family: {
        id: 'family-1',
        regionId: 'region-1',
      },
    });
    memberService.markAsDeceased.mockResolvedValue({
      id: 'member-1',
      isDeceased: true,
    });

    await expect(
      controller.markAsDeceased(
        'member-1',
        { deathDate: '2026-04-02T00:00:00.000Z' },
        {
          user: {
            authType: 'user',
            role: 'ADMIN',
            sub: 'user-1',
          },
        } as any,
      ),
    ).resolves.toEqual({
      id: 'member-1',
      isDeceased: true,
    });

    expect(memberService.markAsDeceased).toHaveBeenCalledWith('member-1', {
      deathDate: '2026-04-02T00:00:00.000Z',
    });
  });

  it('delegates marriage family creation after authorization', async () => {
    memberService.findOne.mockResolvedValue({
      id: 'member-1',
      familyId: 'family-1',
      family: {
        id: 'family-1',
        regionId: 'region-1',
      },
    });
    memberService.createFamilyFromMarriage.mockResolvedValue({
      id: 'family-2',
      familyName: 'New Family',
    });

    await expect(
      controller.createFamilyFromMarriage(
        'member-1',
        { familyName: 'New Family' },
        {
          user: {
            authType: 'user',
            role: 'ADMIN',
            sub: 'user-1',
          },
        } as any,
      ),
    ).resolves.toEqual({
      id: 'family-2',
      familyName: 'New Family',
    });

    expect(memberService.createFamilyFromMarriage).toHaveBeenCalledWith(
      'member-1',
      { familyName: 'New Family' },
    );
  });
});
