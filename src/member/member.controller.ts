import { Controller, Get, Post, Body } from '@nestjs/common';
import { MemberService } from './member.service';

@Controller('members')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Post()
  create(@Body() body: any) {
    return this.memberService.create(body);
  }

  @Get()
  findAll() {
    return this.memberService.findAll();
  }
}
