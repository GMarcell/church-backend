import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  Req,
  ForbiddenException,
  Query,
  ParseEnumPipe,
} from '@nestjs/common';
import { MemberService } from './member.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthPayload } from '../auth/interfaces/auth-payload.interface';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { MemberRole, Role } from '@prisma/client';
import { MemberPelkat } from './member-pelkat.enum';
import { MarkMemberDeceasedDto } from './dto/mark-member-deceased.dto';
import { MarryMemberDto } from './dto/marry-member.dto';

@Controller('v1/member')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Post()
  create(@Body() dto: CreateMemberDto) {
    return this.memberService.create(dto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.memberService.findAll(query);
  }

  @Get('pelkat/:pelkat')
  findByPelkat(
    @Param('pelkat', new ParseEnumPipe(MemberPelkat)) pelkat: MemberPelkat,
    @Query() query: PaginationQueryDto,
  ) {
    return this.memberService.findByPelkat(pelkat, query);
  }

  @Get('count')
  countAll() {
    return this.memberService.countAll();
  }

  @Get('count/pelkat')
  countAllPelkat() {
    return this.memberService.countAllPelkat();
  }

  @Get('count/pelkat/:pelkat')
  countByPelkat(
    @Param('pelkat', new ParseEnumPipe(MemberPelkat)) pelkat: MemberPelkat,
  ) {
    return this.memberService.countByPelkat(pelkat);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.memberService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @Req() req: Request & { user: AuthPayload },
  ) {
    await this.assertCanManageMemberMutation(id, req, {
      targetFamilyId: dto.familyId,
      allowFamilyChangeByRegularMember: false,
      allowRoleChangeByRegularMember: dto.role === undefined,
    });

    return this.memberService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/deceased')
  async markAsDeceased(
    @Param('id') id: string,
    @Body() dto: MarkMemberDeceasedDto,
    @Req() req: Request & { user: AuthPayload },
  ) {
    await this.assertCanManageMemberMutation(id, req);
    return this.memberService.markAsDeceased(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/marriage-family')
  async createFamilyFromMarriage(
    @Param('id') id: string,
    @Body() dto: MarryMemberDto,
    @Req() req: Request & { user: AuthPayload },
  ) {
    await this.assertCanManageMemberMutation(id, req);
    return this.memberService.createFamilyFromMarriage(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.memberService.remove(id);
  }

  private async assertCanManageMemberMutation(
    id: string,
    req: Request & { user: AuthPayload },
    options: {
      targetFamilyId?: string;
      allowFamilyChangeByRegularMember?: boolean;
      allowRoleChangeByRegularMember?: boolean;
    } = {},
  ) {
    const member = await this.memberService.findOne(id);

    if (!member) {
      throw new ForbiddenException('Member not found');
    }

    if (req.user.authType === 'member') {
      if (req.user.isRegionCoordinator) {
        if (member.family.regionId !== req.user.regionId) {
          throw new ForbiddenException(
            'Coordinators can only edit members in their own region',
          );
        }

        if (options.targetFamilyId !== undefined) {
          const targetRegionId = await this.memberService.findFamilyRegionId(
            options.targetFamilyId,
          );

          if (!targetRegionId || targetRegionId !== req.user.regionId) {
            throw new ForbiddenException(
              'Coordinators cannot move members to another region',
            );
          }
        }

        return;
      }

      if (
        options.allowFamilyChangeByRegularMember === false &&
        options.targetFamilyId !== undefined
      ) {
        throw new ForbiddenException(
          'Members cannot change family assignment or member role',
        );
      }

      if (options.allowRoleChangeByRegularMember === false) {
        throw new ForbiddenException(
          'Members cannot change family assignment or member role',
        );
      }

      if (req.user.sub !== id) {
        if (req.user.memberRole !== MemberRole.FAMILY_HEAD) {
          throw new ForbiddenException('Members can only edit their own data');
        }

        if (member.familyId !== req.user.familyId) {
          throw new ForbiddenException(
            'Family heads can only edit members in their own family',
          );
        }
      }

      return;
    }

    if (req.user.authType === 'user' && req.user.role === Role.COORDINATOR) {
      if (member.family.regionId !== req.user.regionId) {
        throw new ForbiddenException(
          'Coordinators can only edit members in their own region',
        );
      }

      if (options.targetFamilyId !== undefined) {
        const targetRegionId = await this.memberService.findFamilyRegionId(
          options.targetFamilyId,
        );

        if (!targetRegionId || targetRegionId !== req.user.regionId) {
          throw new ForbiddenException(
            'Coordinators cannot move members to another region',
          );
        }
      }
    }
  }
}
