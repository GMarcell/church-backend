import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAttendanceDto) {
    const total = dto.maleCount + dto.femaleCount;

    return this.prisma.attendance.create({
      data: {
        serviceDate: new Date(dto.serviceDate),
        serviceType: dto.serviceType,
        maleCount: dto.maleCount,
        femaleCount: dto.femaleCount,
        totalCount: total,
      },
    });
  }

  async findAll() {
    return this.prisma.attendance.findMany();
  }

  async findByDate(date: string) {
    return this.prisma.attendance.findMany({
      where: {
        serviceDate: new Date(date),
      },
    });
  }

  async findByService(service: string) {
    return this.prisma.attendance.findMany({
      where: {
        serviceType: service,
      },
    });
  }
}
