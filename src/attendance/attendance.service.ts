import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

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

  async update(id: string, dto: UpdateAttendanceDto) {
    const existingAttendance = await this.prisma.attendance.findUnique({
      where: { id },
    });

    const maleCount = dto.maleCount ?? existingAttendance?.maleCount ?? 0;
    const femaleCount =
      dto.femaleCount ?? existingAttendance?.femaleCount ?? 0;

    return this.prisma.attendance.update({
      where: { id },
      data: {
        ...(dto.serviceDate !== undefined && {
          serviceDate: new Date(dto.serviceDate),
        }),
        ...(dto.serviceType !== undefined && { serviceType: dto.serviceType }),
        ...(dto.maleCount !== undefined && { maleCount: dto.maleCount }),
        ...(dto.femaleCount !== undefined && { femaleCount: dto.femaleCount }),
        totalCount: maleCount + femaleCount,
      },
    });
  }

  remove(id: string) {
    return this.prisma.attendance.delete({
      where: { id },
    });
  }
}
