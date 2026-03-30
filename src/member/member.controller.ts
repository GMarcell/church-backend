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
} from '@nestjs/common';
import { MemberService } from './member.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthPayload } from '../auth/interfaces/auth-payload.interface';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

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

  @Get('count')
  countAll() {
    return this.memberService.countAll();
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
    if (req.user.authType === 'member' && req.user.sub !== id) {
      throw new ForbiddenException('Members can only edit their own data');
    }

    return this.memberService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.memberService.remove(id);
  }
}
