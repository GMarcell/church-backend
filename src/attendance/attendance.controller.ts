import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  create(@Body() dto: CreateAttendanceDto) {
    return this.attendanceService.create(dto);
  }

  @Get()
  findAll() {
    return this.attendanceService.findAll();
  }

  @Get('date/:date')
  findByDate(@Param('date') date: string) {
    return this.attendanceService.findByDate(date);
  }

  @Get('service/:serviceType')
  findByMember(@Param('serviceType') serviceType: string) {
    return this.attendanceService.findByService(serviceType);
  }
}
