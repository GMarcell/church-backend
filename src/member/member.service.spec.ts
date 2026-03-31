import { Test, TestingModule } from '@nestjs/testing';
import { MemberService } from './member.service';
import { PrismaService } from '../prisma/prisma.service';
import { Gender, MemberRole } from '@prisma/client';
import { MemberPelkat } from './member-pelkat.enum';

describe('MemberService', () => {
  let service: MemberService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<MemberService>(MemberService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('determinePelkat', () => {
    const determinePelkat = (
      birthDate: string,
      gender: Gender,
      role: MemberRole,
    ) =>
      (
        service as unknown as {
          determinePelkat: (member: {
            birthDate: Date;
            gender: Gender;
            role: MemberRole;
          }) => string;
        }
      ).determinePelkat({
        birthDate: new Date(birthDate),
        gender,
        role,
      });

    it('assigns Pelayanan Anak for members age 12 and below', () => {
      expect(
        determinePelkat('2014-03-31T00:00:00.000Z', Gender.MALE, MemberRole.CHILD),
      ).toBe(MemberPelkat.PELAYANAN_ANAK);
    });

    it('assigns Persekutuan Taruna for members age 13 to 16', () => {
      expect(
        determinePelkat('2011-03-31T00:00:00.000Z', Gender.FEMALE, MemberRole.CHILD),
      ).toBe(MemberPelkat.PERSEKUTUAN_TARUNA);
    });

    it('assigns Gerakan Pemuda for unmarried members age 17 to 35', () => {
      expect(
        determinePelkat('2008-03-31T00:00:00.000Z', Gender.MALE, MemberRole.OTHER),
      ).toBe(MemberPelkat.GERAKAN_PEMUDA);
      expect(
        determinePelkat('1991-03-31T00:00:00.000Z', Gender.FEMALE, MemberRole.OTHER),
      ).toBe(MemberPelkat.GERAKAN_PEMUDA);
    });

    it('assigns gendered adult pelkat for members age 36 to 59', () => {
      expect(
        determinePelkat(
          '1990-03-31T00:00:00.000Z',
          Gender.MALE,
          MemberRole.FAMILY_HEAD,
        ),
      ).toBe(MemberPelkat.PERSEKUTUAN_KAUM_BAPAK);
      expect(
        determinePelkat('1980-03-31T00:00:00.000Z', Gender.FEMALE, MemberRole.WIFE),
      ).toBe(MemberPelkat.PERSEKUTUAN_KAUM_PEREMPUAN);
    });

    it('assigns Persekutuan Kaum Lanjut Usia for members age 60 and above', () => {
      expect(
        determinePelkat(
          '1966-03-31T00:00:00.000Z',
          Gender.FEMALE,
          MemberRole.OTHER,
        ),
      ).toBe(MemberPelkat.PERSEKUTUAN_KAUM_LANJUT_USIA);
    });

    it('prioritizes married members below 36 into adult male and female pelkat', () => {
      expect(
        determinePelkat(
          '1998-03-31T00:00:00.000Z',
          Gender.MALE,
          MemberRole.FAMILY_HEAD,
        ),
      ).toBe(MemberPelkat.PERSEKUTUAN_KAUM_BAPAK);
      expect(
        determinePelkat('1998-03-31T00:00:00.000Z', Gender.FEMALE, MemberRole.WIFE),
      ).toBe(MemberPelkat.PERSEKUTUAN_KAUM_PEREMPUAN);
    });
  });

  describe('findByPelkat', () => {
    it('queries unmarried gerakan pemuda members with pagination', async () => {
      const prisma = {
        member: {
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(0),
        },
        $transaction: jest
          .fn()
          .mockImplementation((operations: Promise<unknown>[]) =>
            Promise.all(operations),
          ),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MemberService,
          {
            provide: PrismaService,
            useValue: prisma,
          },
        ],
      }).compile();

      const localService = module.get<MemberService>(MemberService);

      await localService.findByPelkat(MemberPelkat.GERAKAN_PEMUDA, {
        page: '2',
        limit: '5',
      });

      expect(prisma.member.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
          where: expect.objectContaining({
            NOT: {
              role: {
                in: [MemberRole.FAMILY_HEAD, MemberRole.WIFE],
              },
            },
          }),
        }),
      );
      expect(prisma.member.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            NOT: {
              role: {
                in: [MemberRole.FAMILY_HEAD, MemberRole.WIFE],
              },
            },
          }),
        }),
      );
    });
  });
});
