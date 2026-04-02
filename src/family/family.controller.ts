import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { FamilyService } from './family.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthPayload } from '../auth/interfaces/auth-payload.interface';

@Controller('v1/families')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Post()
  create(@Body() dto: CreateFamilyDto) {
    return this.familyService.create(dto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.familyService.findAll(query);
  }

  @Get('count')
  countAll() {
    return this.familyService.countAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.familyService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFamilyDto,
    @Req() req: Request & { user: AuthPayload },
  ) {
    if (req.user.authType === 'member') {
      throw new ForbiddenException('Members cannot edit family data');
    }

    if (req.user.role === Role.COORDINATOR) {
      const family = await this.familyService.findOne(id);

      if (!family || family.regionId !== req.user.regionId) {
        throw new ForbiddenException(
          'Coordinators can only edit families in their own region',
        );
      }

      if (dto.regionId !== undefined && dto.regionId !== req.user.regionId) {
        throw new ForbiddenException(
          'Coordinators cannot move families to another region',
        );
      }
    }

    return this.familyService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.familyService.remove(id);
  }
}
