import { IsDateString, IsInt, IsString, Min } from 'class-validator';

export class CreateAttendanceDto {
  @IsDateString()
  serviceDate: string;

  @IsString()
  serviceType: string;

  @IsInt()
  @Min(0)
  maleCount: number;

  @IsInt()
  @Min(0)
  femaleCount: number;
}
