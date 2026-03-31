import { Test, TestingModule } from '@nestjs/testing';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { MemberPelkat } from './member-pelkat.enum';

describe('MemberController', () => {
  let controller: MemberController;
  const memberService = {
    findByPelkat: jest.fn(),
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
});
