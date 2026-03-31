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
import { MemberRole } from '@prisma/client';
import { MemberPelkat } from './member-pelkat.enum';

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
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @Req() req: Request & { user: AuthPayload },
  ) {
    if (req.user.authType === 'member') {
      if (dto.familyId !== undefined || dto.role !== undefined) {
        throw new ForbiddenException(
          'Members cannot change family assignment or member role',
        );
      }

      if (req.user.sub !== id) {
        if (req.user.memberRole !== MemberRole.FAMILY_HEAD) {
          throw new ForbiddenException('Members can only edit their own data');
        }

        const targetMember = this.memberService.findOne(id);

        return targetMember.then((member) => {
          if (!member || member.familyId !== req.user.familyId) {
            throw new ForbiddenException(
              'Family heads can only edit members in their own family',
            );
          }

          return this.memberService.update(id, dto);
        });
      }
    }

    return this.memberService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.memberService.remove(id);
  }
}
