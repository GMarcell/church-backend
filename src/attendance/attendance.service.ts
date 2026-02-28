import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateAttendanceDto) {
    const totalCount = dto.maleCount + dto.femaleCount;

    return this.prisma.attendance.create({
      data: {
        serviceDate: new Date(dto.serviceDate),
        serviceType: dto.serviceType,
        maleCount: dto.maleCount,
        femaleCount: dto.femaleCount,
        totalCount,
      },
    });
  }

  findAll() {
    return this.prisma.attendance.findMany();
  }

  findOne(id: string) {
    return this.prisma.attendance.findUnique({
      where: { id },
    });
  }

  remove(id: string) {
    return this.prisma.attendance.delete({
      where: { id },
    });
  }
}
