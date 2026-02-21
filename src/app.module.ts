import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MemberModule } from './member/member.module';
import { AttendanceModule } from './attendance/attendance.module';
import { GivingModule } from './giving/giving.module';
import { BranchModule } from './branch/branch.module';
import { RegionModule } from './region/region.module';
import { FamilyModule } from './family/family.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MemberModule,
    AttendanceModule,
    GivingModule,
    BranchModule,
    RegionModule,
    FamilyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
